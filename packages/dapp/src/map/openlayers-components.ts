import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style, Circle as CircleStyle, Icon } from "ol/style";
import { Select, Draw, Modify } from "ol/interaction";
import { singleClick } from "ol/events/condition";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import { Point, Polygon, MultiPolygon } from "ol/geom";
import { getCenter } from "ol/extent";
import { ecologicalAssetsGeoJSON } from "./data";

export type Basemap = "cartographic" | "satellite";

// Basemaps
// OpenStreet Maps
const cartographicBasemap = new TileLayer({
  source: new OSM(),
});

// Google Maps
const satelliteBasemap = new TileLayer({
  source: new XYZ({
    urls: [
      "http://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      "http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      "http://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      "http://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    ],
  }),
});

export const basemaps: Record<Basemap, TileLayer<OSM | XYZ>> = {
  cartographic: cartographicBasemap,
  satellite: satelliteBasemap,
};

// Styles
export const deleteHoverStyle = new Style({
  fill: new Fill({
    color: [255, 0, 0, 0.3],
  }),
  stroke: new Stroke({
    color: "red",
    width: 2,
  }),
});

const makeStrippedPattern = () => {
  const cnv = document.createElement("canvas");
  const ctx = cnv.getContext("2d");
  cnv.width = 8;
  cnv.height = 8;
  ctx.lineWidth = 600;
  ctx.fillStyle = "#4287f5"; // light blue

  for (let i = 0; i < 6; ++i) {
    ctx.fillRect(i, i, 1, 1);
  }

  return ctx.createPattern(cnv, "repeat");
};

// Layers setup
export const editLayer = new VectorLayer({
  properties: {
    id: "edit-layer",
  },
  source: new VectorSource<MultiPolygon>(),
  style: new Style({
    fill: new Fill({
      color: [0, 153, 255, 0.3],
    }),
    stroke: new Stroke({
      color: [4, 65, 106],
      width: 2,
    }),
  }),
});

export const previewLayer = new VectorLayer({
  properties: {
    id: "preview-layer",
  },
  source: new VectorSource<MultiPolygon>(),
  style: new Style({
    fill: new Fill({
      color: makeStrippedPattern(),
    }),
    stroke: new Stroke({
      color: [4, 65, 106],
      width: 2,
    }),
  }),
});

export const ecologicalAssets = new VectorLayer({
  properties: {
    id: "ecological-assets-layer",
  },
  source: new VectorSource({
    features: new GeoJSON({ featureProjection: "EPSG:3857" }).readFeatures(
      ecologicalAssetsGeoJSON
    ),
  }),
  style: new Style({
    fill: new Fill({
      color: [50, 168, 82, 0.3],
    }),
    stroke: new Stroke({
      color: [26, 97, 45],
      width: 2,
    }),
  }),
});

export const ecologicalAssetsCentroids = new VectorLayer({
  source: new VectorSource<Point>({
    features: ecologicalAssets
      .getSource()
      .getFeatures()
      .map((feature) => {
        const extent = feature.getGeometry().getExtent();
        const centroid = getCenter(extent);
        return new Feature({
          geometry: new Point(centroid),
        });
      }),
  }),
  style: new Style({
    image: new Icon({
      scale: 0.5,
      displacement: [-16, 43],
      anchorXUnits: "pixels",
      anchorYUnits: "pixels",
      src: "kolektivo_tree_green.png",
    }),
  }),
});

// Interactions
export const select = new Select({
  style: new Style({
    fill: new Fill({
      color: "rgba(230, 242, 5, 0.7)",
    }),
    stroke: new Stroke({
      color: "#34e1eb",
      width: 2,
    }),
  }),
  layers: [ecologicalAssets],
});

export const draw = new Draw({
  source: editLayer.getSource(),
  type: "MultiPolygon",
  trace: true,
  stopClick: true,
});

draw.setActive(false);

const modifyStyleWidth = 3;
export const modify = new Modify({
  source: editLayer.getSource(),
  style: new Style({
    image: new CircleStyle({
      radius: modifyStyleWidth * 2,
      fill: new Fill({
        color: "orange",
      }),
      stroke: new Stroke({
        color: "white",
        width: modifyStyleWidth / 2,
      }),
    }),
  }),
  deleteCondition: (event) => {
    return singleClick(event) && event.originalEvent.ctrlKey;
  },
});
