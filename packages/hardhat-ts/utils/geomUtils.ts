/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unsupported-features/es-syntax */
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import turfCentroid from "@turf/centroid";
import {
  GeoJSON,
  Feature,
  Geometry,
  Polygon,
  MultiPolygon,
  GeoJsonProperties,
  GeoJsonObject,
  Position,
} from "geojson";

// Solidity version of GeoJSON types
// Uses BigNumber (integer) as coordinates to avoid decimals
type PositionSol = BigNumber[]; // Coordinates point -> [X, Y]

interface PointSol extends GeoJsonObject {
  type: "Point";
  coordinates: PositionSol;
}

interface MultiPointSol extends GeoJsonObject {
  type: "MultiPoint";
  coordinates: PositionSol[];
}

interface LineStringSol extends GeoJsonObject {
  type: "LineString";
  coordinates: PositionSol[];
}

interface MultiLineStringSol extends GeoJsonObject {
  type: "MultiLineString";
  coordinates: PositionSol[][];
}

interface PolygonSol extends GeoJsonObject {
  type: "Polygon";
  coordinates: PositionSol[][];
}

interface MultiPolygonSol extends GeoJsonObject {
  type: "MultiPolygon";
  coordinates: PositionSol[][][];
}

type GeometrySol =
  | PointSol
  | MultiPointSol
  | LineStringSol
  | MultiLineStringSol
  | PolygonSol
  | MultiPolygonSol;

interface FeatureSol<
  G extends GeometrySol | null = GeometrySol,
  P = GeoJsonProperties
> extends GeoJsonObject {
  type: "Feature";
  geometry: G;
  properties: P;
}

interface FeatureCollectionSol<
  G extends GeometrySol | null = GeometrySol,
  P = GeoJsonProperties
> extends GeoJsonObject {
  type: "FeatureCollection";
  features: Array<FeatureSol<G, P>>;
}

export type GeoJSONSol = FeatureCollectionSol;

export const isPolygon = (geometry: Geometry | GeometrySol): boolean => {
  const geomType = geometry.type;
  return geomType === "Polygon" || geomType === "MultiPolygon";
};

export const transformSolidityGeoJSON = (geojson: GeoJSON): GeoJSONSol => {
  if (geojson.type !== "FeatureCollection") {
    throw new Error(`
      Invalid GeoJSON type '${geojson.type}'. Value must be 'FeatureCollection'.
    `);
  }

  return {
    ...geojson,
    features: transformFeatures(geojson.features),
  };
};

const transformFeatures = (features: Feature[]): FeatureSol[] => {
  return features.map((feature) => {
    if (feature.geometry.type === "GeometryCollection") {
      throw new Error(`
        Invalid geometry type: ${feature.geometry.type}. 
        Value must be 'Point', 'MultiPoint', 'LineString', 
        'MultiLineString', 'Polygon' or 'MultiPolygon'.
      `);
    }

    return {
      ...feature,
      geometry: transformGeometry(feature.geometry),
    };
  });
};

// Typescript overload function to handle multiple Geometry types returns
type TransformGeometryOverload = {
  (geometry: Geometry): PointSol;
  (geometry: Geometry): MultiPointSol;
  (geometry: Geometry): LineStringSol;
  (geometry: Geometry): MultiLineStringSol;
  (geometry: Geometry): PolygonSol;
  (geometry: Geometry): MultiPolygonSol;
};

const transformGeometry: TransformGeometryOverload = (
  geometry: Geometry
): any => {
  if (geometry.type === "GeometryCollection") {
    throw new Error(`
      Invalid geometry type: ${geometry.type}. 
      Value must be 'Point', 'MultiPoint', 'LineString', 
      'MultiLineString', 'Polygon' or 'MultiPolygon'.
    `);
  }

  return {
    ...geometry,
    coordinates: transformCoordinatesRecursively(geometry.coordinates),
  };
};

// loop through all the nested arrays of the coordinates and, when find a coordinate,
// returns the value as BigNumber to remove decimals up to 9 digits.
type RCoordinates = number | BigNumber | RCoordinates[]; // Recursive coordinates type
const transformCoordinatesRecursively = (value: RCoordinates): RCoordinates => {
  return Array.isArray(value)
    ? value.map(transformCoordinatesRecursively)
    : solidityCoordinate(value as number);
};

export const solidityCoordinate = (coord: number): BigNumber => {
  const DECIMAL_EXPONENT = 10 ** 9;
  return ethers.BigNumber.from(Math.floor(coord * DECIMAL_EXPONENT));
};

export const centroid = (geometry: Polygon | MultiPolygon): Position => {
  const feature = turfCentroid(geometry);
  return feature.geometry.coordinates;
};
