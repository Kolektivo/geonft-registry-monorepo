import { inject, computedFrom } from "aurelia-framework";
import { createMachine, interpret, Interpreter } from "xstate";
import { StateMachine } from "xstate/lib/types";
import { ResolveTypegenMeta } from "xstate";
import { State } from "xstate/lib/State";
import { Draw, Modify } from "ol/interaction";
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
import { TypegenDisabled, BaseActionObject, ServiceMap } from "xstate";
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
import { Interpretation } from "@aurelia/runtime-html";

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
  | "SUBMIT_METADATA"
  | "EDIT_MODE"
  | "START_DRAWING"
  | "DELETE_FEATURE"
  | "EDIT_FEATURES";

type MachineEvents = { type: MachineEventsType };

const mapMachine = createMachine<null, MachineEvents>({
  initial: "idle",
  predictableActionArguments: true,
  states: {
    idle: {
      on: {
        CREATE_FOODFOREST: "metadata",
      },
    },
    metadata: {
      on: {
        SUBMIT_METADATA: "edition",
        CANCEL_METADATA: "idle",
      },
    },
    edition: {
      initial: "draw",
      states: {
        draw: {
          on: {
            EDIT_MODE: "modify",
          },
        },
        modify: {
          entry: ["startModifying"],
          exit: ["stopModifying"],
          on: {
            START_DRAWING: "draw",
            DELETE_FEATURE: "delete",
          },
        },
        delete: {
          on: {
            EDIT_MODE: "modify",
          },
        },
      },
    },
    preview: {},
  },
});
const service = interpret(mapMachine);

@inject(Element)
export class MapComponent {
  public mapDiv: HTMLDivElement;
  map: Map;
  service = service;
  state = service.initialState;
  sidebar = true;
  sidebarButton = true;
  editLayer: VectorLayer<VectorSource<MultiPolygon>>;
  previewLayer: VectorLayer<VectorSource<MultiPolygon>>;
  testLayer: VectorLayer<VectorSource<Geometry>>;
  draw: Draw;
  modify: Modify;
  select: Select;
  currentBasemap: Basemap = "cartographic";

  public attached(): void {
    const newMachine = mapMachine.withConfig({
      actions: {
        startModifying: () => this.enableModifyFeature(),
        stopModifying: () => this.disableModifyFeature(),
      },
    });
    this.service.machine = newMachine;
    this.service.onTransition((state) => console.log(state.value));
    this.service.start();
    // Layers setup
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

    // Map setup
    const initialCenter = [-68.95, 12.138];
    const initialZoom = 7;
    const initBasemap = basemaps[this.currentBasemap];

    const map = new Map({
      layers: [initBasemap, editLayer, previewLayer, testLayer],
      target: "map",
      view: new View({
        center: fromLonLat(initialCenter),
        zoom: initialZoom,
      }),
    });

    // Interactions
    const select = new Select({
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
    map.addInteraction(select);

    const draw = new Draw({
      source: editLayer.getSource(),
      type: "MultiPolygon",
      trace: true,
      stopClick: true,
    });
    draw.on("drawend", () => {
      if (this.state.matches("edition")) {
        draw.setActive(false);
        this.stateTransition("EDIT_MODE");
      }
    });
    draw.setActive(false);
    map.addInteraction(draw);

    const modify = new Modify({ source: editLayer.getSource() });
    map.addInteraction(modify);

    this.map = map;
    this.draw = draw;
    this.modify = modify;
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

  private stateTransition(newStateEvent: MachineEventsType): void {
    const newState = this.service.send(newStateEvent);
    this.state = newState;
  }

  // UI FUNCTIONS
  public toggleSidebar(): void {
    this.sidebar = !this.sidebar;
  }

  // IDLE FUNCTIONS
  public createFoodforest(): void {
    this.stateTransition("CREATE_FOODFOREST");
  }

  // METADATA FUNCTIONS
  public cancelMetadata(): void {
    this.stateTransition("CANCEL_METADATA");
  }

  public submitMetadata(): void {
    this.stateTransition("SUBMIT_METADATA");
    this.sidebar = false;
    this.sidebarButton = false;
    this.drawFeature();
  }

  // EDITION FUNCTIONS
  public drawFeature(): void {
    this.stateTransition("START_DRAWING");
    this.startDrawing();
  }

  public modifyFeatures(): void {
    this.stateTransition("EDIT_MODE");
    this.stopDrawing();
    console.log(this.state.value);
  }

  public deleteFeatures(): void {
    this.stateTransition("DELETE_FEATURE");
  }

  // MAP FUNCTIONS
  private startDrawing(): void {
    this.draw.setActive(true);
    this.map.removeInteraction(this.select);
  }

  private stopDrawing(): void {
    this.draw.setActive(false);
  }

  private enableModifyFeature(): void {
    this.modify.setActive(true);
  }

  private disableModifyFeature(): void {
    this.modify.setActive(false);
  }

  private undo(): void {
    this.draw.removeLastPoint();
  }

  private finishDrawing(): void {
    this.draw.setActive(false);
  }

  private cancelDrawing(): void {
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

  // GETTERS
  @computedFrom("state.value")
  public get isIdleState(): boolean {
    return this.state.value === "idle";
  }

  @computedFrom("state.value")
  public get isMetadataState(): boolean {
    return this.state.value === "metadata";
  }

  @computedFrom("state.value")
  public get isEditionState(): boolean {
    return this.state.matches("edition");
  }

  @computedFrom("state.value")
  public get isModifyState(): boolean {
    return this.state.matches("edition.modify");
  }

  @computedFrom("state.value")
  public get isDrawState(): boolean {
    return this.state.matches("edition.draw");
  }

  @computedFrom("state.value")
  public get isDeleteState(): boolean {
    return this.state.matches("edition.delete");
  }
}
