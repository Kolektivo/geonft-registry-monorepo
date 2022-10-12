import { inject, computedFrom } from "aurelia-framework";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Select, Draw, Modify } from "ol/interaction";
import { Geometry, MultiPolygon } from "ol/geom";
import { machine, machineInterpreter, MachineEventsType } from "./machine";
import {
  basemaps,
  testLayer,
  editLayer,
  select,
  draw,
  modify,
  Basemap,
} from "./openlayers-components";
import "ol/ol.css";
import "./map-component.scss";

@inject(Element)
export class MapComponent {
  public mapDiv: HTMLDivElement;
  map: Map;
  service = machineInterpreter;
  state = machineInterpreter.initialState;
  sidebar = true;
  sidebarButton = true;
  editLayer: VectorLayer<VectorSource<MultiPolygon>>;
  testLayer: VectorLayer<VectorSource<Geometry>>;
  select: Select;
  draw: Draw;
  modify: Modify;
  currentBasemap: Basemap = "cartographic";

  public attached(): void {
    // Machine setup
    const newMachine = machine.withConfig({
      actions: {
        enterModify: () => this.enableModifyFeature(),
        exitModify: () => this.disableModifyFeature(),
      },
    });
    this.service.machine = newMachine;
    this.service.onTransition((state) => console.log(state.value));
    this.service.start();

    // Map setup
    const initialCenter = [-68.95, 12.138];
    const initialZoom = 7;
    const initialBasemap = basemaps[this.currentBasemap];
    const map = new Map({
      layers: [initialBasemap, editLayer, testLayer],
      target: "map",
      view: new View({
        center: fromLonLat(initialCenter),
        zoom: initialZoom,
      }),
    });

    map.addInteraction(select);
    map.addInteraction(draw);
    map.addInteraction(modify);

    draw.on("drawend", () => {
      if (this.state.matches("edition")) {
        draw.setActive(false);
        this.stateTransition("EDIT_MODE");
      }
    });

    this.map = map;
    this.editLayer = editLayer;
    this.select = select;
    this.draw = draw;
    this.modify = modify;
  }

  // Helpers
  private stateTransition(newStateEvent: MachineEventsType): void {
    const newState = this.service.send(newStateEvent);
    this.state = newState;
  }

  private confirmAction(text: string, callback: () => void) {
    if (confirm(text)) {
      callback();
    }
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
  }

  public deleteFeatures(): void {
    this.stateTransition("DELETE_FEATURE");
  }

  public returnToMetadata(): void {
    this.confirmAction(
      "Are you sure you want to return? Edited features will be deleted",
      () => {
        this.stopDrawing();
        this.clearEditLayer();
        this.stateTransition("CANCEL_EDITION");
        this.sidebar = true;
        this.sidebarButton = true;
      }
    );
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

  private clearEditLayer(): void {
    this.editLayer.getSource().clear();
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
