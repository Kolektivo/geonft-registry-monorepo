import { inject } from "aurelia-framework";
import { createMachine } from "xstate";
import { StateMachine } from "xstate/lib/types";
import { State } from "xstate/lib/State";
import Draw from "ol/interaction/Draw";
import GeoJSON from "ol/format/GeoJSON";
import Circle from "ol/geom/Circle";
import FeatureOl from "ol/Feature";
import { fromLonLat } from "ol/proj";
import Map from "ol/Map";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import Select from "ol/interaction/Select";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import View from "ol/View";
import { Fill, Stroke, Style } from "ol/style";
import "ol/ol.css";
import {
  weatherStationsGeoJSON,
  foodforestsGeoJSON,
  testGeoJSON,
} from "./map-component.data";
import "./map-component.scss";
import { Feature, FeatureCollection } from "geojson";
import TileLayer from "ol/layer/Tile";
import { Geometry, MultiPolygon, Polygon, SimpleGeometry } from "ol/geom";

type Basemap = "cartographic" | "satellite";

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

const basemaps: Record<Basemap, TileLayer<OSM | XYZ>> = {
  cartographic: cartographicBasemap,
  satellite: satelliteBasemap,
};

// State machine
type MachineEventsType =
  | "CREATE_FOODFOREST"
  | "CANCEL_METADATA"
  | "START_EDITION"
  | "FINISH_DRAWING"
  | "START_DRAWING"
  | "DELETE_FEATURE";
type MachineEvents = { type: MachineEventsType };

const mapStateMachine = createMachine<null, MachineEvents>({
  id: "map-machine",
  initial: "idle",
  states: {
    idle: {
      on: { CREATE_FOODFOREST: "metadata" },
    },
    metadata: {
      on: {
        START_EDITION: "edition",
        CANCEL_METADATA: "idle",
      },
    },
    edition: {
      initial: "draw",
      states: {
        draw: {
          on: {
            FINISH_DRAWING: "edit",
          },
        },
        edit: {
          on: {
            START_DRAWING: "draw",
            DELETE_FEATURE: "delete",
          },
        },
        delete: {},
      },
    },
    preview: {},
  },
});

@inject(Element)
export class MapComponent {
  public mapDiv: HTMLDivElement;
  map: Map;
  state = mapStateMachine.initialState;
  sidebar = true;
  sidebarButton = true;
  editLayer: VectorLayer<VectorSource<MultiPolygon>>;
  previewLayer: VectorLayer<VectorSource<MultiPolygon>>;
  testLayer: VectorLayer<VectorSource<Geometry>>;
  draw: Draw;
  select: Select;
  currentBasemap: Basemap = "cartographic";

  public attached(): void {
    const initialCenter = [-68.95, 12.138];
    const initialZoom = 7;

    const editStyle = new Style({
      fill: new Fill({
        color: [245, 203, 66, 0.3],
      }),
      stroke: new Stroke({
        color: [189, 147, 9],
        width: 2,
      }),
    });
    const editLayer = new VectorLayer({
      source: new VectorSource<MultiPolygon>(),
      style: editStyle,
    });

    const previewStyle = new Style({
      fill: new Fill({
        color: this.makeStrippedPattern(),
      }),
      stroke: new Stroke({
        color: [42, 86, 156],
        width: 2,
      }),
    });
    const previewLayer = new VectorLayer({
      source: new VectorSource<MultiPolygon>(),
      style: previewStyle,
    });

    const testStyle = new Style({
      fill: new Fill({
        color: [50, 168, 82, 0.3],
      }),
      stroke: new Stroke({
        color: [26, 97, 45],
        width: 2,
      }),
    });
    const testLayer = new VectorLayer({
      source: new VectorSource({
        features: new GeoJSON({ featureProjection: "EPSG:3857" }).readFeatures(
          testGeoJSON
        ),
      }),
      style: testStyle,
    });

    const initBasemap = basemaps[this.currentBasemap];
    const map = new Map({
      layers: [initBasemap, editLayer, previewLayer, testLayer],
      target: "map",
      view: new View({
        center: fromLonLat(initialCenter),
        zoom: initialZoom,
      }),
    });

    const selectStyle = new Style({
      fill: new Fill({
        color: "rgba(230, 242, 5, 0.7)",
      }),
      stroke: new Stroke({
        color: "#34e1eb",
        width: 2,
      }),
    });

    const draw = new Draw({
      source: editLayer.getSource(),
      type: "MultiPolygon",
      trace: true,
      stopClick: true,
    });
    draw.on("drawend", () => {
      if (this.state.matches("edition")) {
        draw.setActive(false);
        this.stateTransition("FINISH_DRAWING");
      }
    });
    draw.setActive(false);
    map.addInteraction(draw);

    // select interaction working on "singleclick"
    const select = new Select({
      style: selectStyle,
      layers: [testLayer],
    });

    map.addInteraction(select);

    this.map = map;
    this.draw = draw;
    this.select = select;
    this.editLayer = editLayer;
    this.previewLayer = previewLayer;
  }

  private makeStrippedPattern() {
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
  }

  public toggleSidebar(): void {
    this.sidebar = !this.sidebar;
  }

  private stateTransition(newStateEvent: MachineEventsType): void {
    const newState = mapStateMachine.transition(this.state, {
      type: newStateEvent,
    });
    this.state = newState;
  }

  public createFoodforest() {
    this.stateTransition("CREATE_FOODFOREST");
  }

  public cancelMetadata() {
    this.stateTransition("CANCEL_METADATA");
  }

  public startEdition() {
    this.stateTransition("START_EDITION");
    this.sidebar = false;
    this.sidebarButton = false;
    this.startDrawing();
  }

  public toggleBasemap(): void {
    const newBasemap: Basemap =
      this.currentBasemap === "cartographic" ? "satellite" : "cartographic";
    const oldBasemapLayer = basemaps[this.currentBasemap];
    const newBasemapLayer = basemaps[newBasemap];

    this.map.addLayer(newBasemapLayer);
    this.map.removeLayer(oldBasemapLayer);
    this.currentBasemap = newBasemap;
    newBasemapLayer.setZIndex(-1);
  }

  public startDrawing(): void {
    this.stateTransition("START_DRAWING");
    this.draw.setActive(true);
    this.map.removeInteraction(this.select);
  }

  public stopDrawing(): void {
    this.draw.setActive(false);
  }

  public undo(): void {
    this.draw.removeLastPoint();
  }

  public finishDrawing(): void {
    this.draw.setActive(false);
  }

  public cancelDrawing(): void {
    this.draw.abortDrawing();
    this.map.addInteraction(this.select);
    this.editLayer.getSource().clear();
  }

  private applyDrawnFeaturesToLayer(
    targetLayer: VectorLayer<VectorSource<Geometry>>
  ): void {
    const drawnFeatures = this.editLayer.getSource().getFeatures();
    this.editLayer.getSource().clear();
    targetLayer.getSource().addFeatures(drawnFeatures);
  }
}
