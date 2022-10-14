import { inject, computedFrom } from "aurelia-framework";
import Map from "ol/Map";
import View from "ol/View";
import Feature from "ol/Feature";
import { fromLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {
  Select,
  Draw,
  Modify,
  defaults as defaultInteractions,
} from "ol/interaction";
import { defaults as defaultControls } from "ol/control";
import { Geometry, Polygon, MultiPolygon } from "ol/geom";
import { machine, machineInterpreter, MachineEventsType } from "./machine";
import {
  basemaps,
  testLayer,
  testLayerCentroids,
  editLayer,
  previewLayer,
  select,
  draw,
  modify,
  editLayerStyle,
  deleteHoverStyle,
  Basemap,
} from "./openlayers-components";
import "ol/ol.css";
import "./map-component.scss";

const metadataDefaultValues = {
  name: "",
  description: "",
  locationAddress: "",
  email: "",
  phoneNumber: undefined,
  numberManagers: undefined,
  date: new Date().toISOString().split("T")[0], // To get yyyy-mm-dd format
};

@inject(Element)
export class MapComponent {
  public mapDiv: HTMLDivElement;
  map: Map;
  service = machineInterpreter;
  state = machineInterpreter.initialState;
  sidebar = true;
  sidebarButton = true;
  metadata = { ...metadataDefaultValues };
  editLayer: VectorLayer<VectorSource<Polygon>>;
  previewLayer: VectorLayer<VectorSource<MultiPolygon>>;
  testLayer: VectorLayer<VectorSource<Geometry>>;
  select: Select;
  draw: Draw;
  modify: Modify;
  currentBasemap: Basemap = "cartographic";
  drawnFeaturesCount = 0;
  lastDeleteHighlightedFeature: Feature;
  bufferEdition: Array<[number, number]> = [];
  mintedGeoNfts: Array<Record<string, unknown>> = [];

  public attached(): void {
    // Update machine with the new actions
    // They cannot be defined before because they access class variables and methods
    const newMachine = machine.withConfig({
      actions: {
        enterEdition: () => this.enterEdition(),
        enterDraw: () => this.enterDraw(),
        exitDraw: () => this.exitDraw(),
        enterModify: () => this.enterModify(),
        exitModify: () => this.exitModify(),
        enterPreview: () => this.enterPreview(),
      },
    });
    this.service.machine = newMachine;
    // Uncomment to log every state transition
    // this.service.onTransition((state) => console.log(state.value));
    this.service.start();

    // Map setup
    const initialCenter = [-68.95, 12.208];
    const initialZoom = 7;
    const showAttribution = true;
    const initialBasemap = basemaps[this.currentBasemap];
    const map = new Map({
      layers: [
        initialBasemap,
        editLayer,
        previewLayer,
        testLayer,
        testLayerCentroids,
      ],
      target: "map",
      view: new View({
        center: fromLonLat(initialCenter),
        zoom: initialZoom,
      }),
      interactions: defaultInteractions().extend([select, draw, modify]),
      controls: defaultControls({ attribution: showAttribution }),
    });

    // EVENTS
    // Deletes feature on click when delete mode is active
    map.on("click", (e) => {
      if (!this.isDeleteState) return;

      // Iterate over all layers intersecting the clicked pixel
      map.forEachFeatureAtPixel(e.pixel, (feature: Feature<Polygon>, layer) => {
        const layerId = layer.get("id");

        // Delete the feature only if the layer is the edit layer
        if (layerId === "edit-layer") {
          this.confirmAction("Delete feature? This action is permanent", () => {
            editLayer.getSource().removeFeature(feature);
            this.drawnFeaturesCount--;

            if (this.editLayerIsEmpty) {
              this.stateTransition("DRAW_FEATURE");
            }
          });
        }
      });
    });

    // Highlight feature on hover when delete mode is active
    map.on("pointermove", (e) => {
      if (!this.isDeleteState) return;

      let foundLayer;
      let foundFeature;

      // Check if mouse is over a edit layer feature
      map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
        const layerId = layer.get("id");

        if (layerId === "edit-layer") {
          foundLayer = layer;
          foundFeature = feature;
          return;
        }
      });

      // If mouse is over an edit layer feature, set its style to delete hover style and set it
      // as the last delete highlighted feature. Otherwise, reset last delete highlighted feature
      // to its default style
      if (foundLayer) {
        foundFeature.setStyle(deleteHoverStyle);
        this.lastDeleteHighlightedFeature = foundFeature;
      } else {
        this.lastDeleteHighlightedFeature
          ? this.lastDeleteHighlightedFeature.setStyle(editLayerStyle)
          : (this.lastDeleteHighlightedFeature = undefined);
      }
    });

    // Increase the drawn features counter on draw end
    draw.on("drawend", (e) => {
      if (this.state.matches("edition")) {
        this.drawnFeaturesCount++;
      }
    });

    this.map = map;
    this.editLayer = editLayer;
    this.previewLayer = previewLayer;
    this.select = select;
    this.draw = draw;
    this.modify = modify;
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
    this.metadata = metadataDefaultValues;
    this.stateTransition("CANCEL_METADATA");
  }

  public submitMetadata(): void {
    this.stateTransition("SUBMIT_METADATA");
  }

  // EDITION FUNCTIONS
  public drawFeature(): void {
    this.stateTransition("DRAW_FEATURE");
  }

  public modifyFeatures(): void {
    this.stateTransition("MODIFY_FEATURE");
  }

  public deleteFeature(): void {
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

  public finishEdition(): void {
    this.stateTransition("FINISH_EDITION");
  }

  // PREVIEW FUNCTIONS
  public getFormattedMetadata(): Array<{ label: string; value: string }> {
    const NOT_DEFINED = "Not defined";

    return [
      {
        label: "Name",
        value: this.metadata.name || NOT_DEFINED,
      },
      {
        label: "Description",
        value: this.metadata.description || NOT_DEFINED,
      },
      {
        label: "Location address",
        value: this.metadata.locationAddress || NOT_DEFINED,
      },
      {
        label: "Phone number",
        value: this.metadata.phoneNumber?.toString() || NOT_DEFINED,
      },
      {
        label: "Number of managers",
        value: this.metadata.numberManagers?.toString() || NOT_DEFINED,
      },
      {
        label: "Date established",
        value: new Date(this.metadata.date).toLocaleDateString("en-US"),
      },
    ];
  }

  public cancelPreview(): void {
    this.stateTransition("CANCEL_PREVIEW");
  }

  public mintGeoNFT(): void {
    this.stateTransition("MINT_GEONFT");
    this.applyDrawnFeaturesToLayer(this.previewLayer);
    this.mintedGeoNfts.push(this.metadata);
    this.metadata = { ...metadataDefaultValues };
  }

  // ACTIONS
  private enterEdition(): void {
    this.sidebar = false;
    this.sidebarButton = false;
  }

  private enterDraw(): void {
    this.startDrawing();
  }

  private exitDraw(): void {
    this.stopDrawing();
  }

  private enterModify(): void {
    this.modify.setActive(true);
  }

  private exitModify(): void {
    this.modify.setActive(false);
  }

  private enterPreview(): void {
    this.sidebar = true;
    this.sidebarButton = true;
    // Focus view on editLayer?
  }

  // MAP FUNCTIONS
  private startDrawing(): void {
    this.draw.setActive(true);
    this.modify.setActive(false);
    this.map.removeInteraction(this.select);
  }

  private stopDrawing(): void {
    this.draw.setActive(false);
  }

  private clearEditLayer(): void {
    this.editLayer.getSource().clear();
  }

  public undo(): void {
    const sketchLineCoords = this.draw["sketchLineCoords_"];
    const lastPoint = sketchLineCoords.slice(-1);
    this.bufferEdition.push(lastPoint);
    this.draw.removeLastPoint();
  }

  // NOTE: Experimental
  public redo(): void {
    const lastUndoPoint = this.bufferEdition.pop();
    if (lastUndoPoint) {
      this.draw["sketchLineCoords_"].push(lastUndoPoint[0]);
      // TODO: Refresh render to show changes
    }
  }

  private applyDrawnFeaturesToLayer(
    targetLayer: VectorLayer<VectorSource<Geometry>>
  ): void {
    const targetStyle = targetLayer.getStyle();
    const drawnFeatures = this.editLayer.getSource().getFeatures();
    this.editLayer.getSource().clear();
    drawnFeatures.map((feature) => feature.setStyle(targetStyle));
    targetLayer.getSource().addFeatures(drawnFeatures);
  }

  // HELPERS
  private stateTransition(newStateEvent: MachineEventsType): void {
    const newState = this.service.send(newStateEvent);
    this.state = newState;
  }

  private confirmAction(text: string, callback: () => void) {
    if (confirm(text)) {
      callback();
    }
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

  @computedFrom("drawnFeaturesCount")
  public get editLayerIsEmpty(): boolean {
    return this.editLayer.getSource().isEmpty();
  }

  @computedFrom("state.value")
  public get isPreviewState(): boolean {
    return this.state.value === "preview";
  }

  @computedFrom("bufferEdition.length")
  public get isBufferEditionEmpty(): boolean {
    return this.bufferEdition.length === 0;
  }
}
