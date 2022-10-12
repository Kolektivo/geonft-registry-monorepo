import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style, Circle as CircleStyle } from "ol/style";
import { Select, Draw, Modify } from "ol/interaction";
import { shiftKeyOnly, singleClick } from "ol/events/condition";
import GeoJSON from "ol/format/GeoJSON";
import { MultiPolygon } from "ol/geom";
import { testGeoJSON } from "./map-component.data";

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

// Layers setup
export const editLayer = new VectorLayer({
  source: new VectorSource<MultiPolygon>(),
  style: new Style({
    fill: new Fill({
      color: [245, 203, 66, 0.3],
    }),
    stroke: new Stroke({
      color: [189, 147, 9],
      width: 2,
    }),
  }),
});

export const testLayer = new VectorLayer({
  source: new VectorSource({
    features: new GeoJSON({ featureProjection: "EPSG:3857" }).readFeatures(
      testGeoJSON
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
  layers: [testLayer],
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
