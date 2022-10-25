import { inject, computedFrom } from "aurelia-framework";
import { v4 as uuidv4 } from "uuid";
import { multiPolygon as turfMultiPolygon } from "@turf/helpers";
import turfBooleanIntersects from "@turf/boolean-intersects";
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
import { Geometry, MultiPolygon } from "ol/geom";
import { machine, machineInterpreter, MachineEventsType } from "./machine";
import {
  basemaps,
  ecologicalAssets,
  ecologicalAssetsCentroids,
  editLayer,
  previewLayer,
  select,
  draw,
  modify,
  deleteHoverStyle,
  Basemap,
} from "./openlayers-components";
import { Properties } from "./data";
import "ol/ol.css";
import "./map-component.scss";

const metadataDefaultValues: Properties = {
  registered: false,
  name: "",
  description: "",
  locationAddress: "",
  email: "",
  phoneNumber: undefined,
  numberManagers: undefined,
  date: new Date().toISOString().split("T")[0],
};

const initMintedGeoNfts: Array<Properties> = ecologicalAssets
  .getSource()
  .getFeatures()
  .map((feature) => feature.getProperties() as Properties);

@inject(Element)
export class MapComponent {
  public mapDiv: HTMLDivElement;
  map: Map;
  service = machineInterpreter;
  state = machineInterpreter.initialState;
  sidebar = true;
  sidebarButton = true;
  metadata: Properties = { ...metadataDefaultValues, id: uuidv4() };
  editLayer: VectorLayer<VectorSource<MultiPolygon>>;
  backupEditFeature: Feature<MultiPolygon>;
  previewLayer: VectorLayer<VectorSource<MultiPolygon>>;
  ecologicalAssets: VectorLayer<VectorSource<Geometry>>;
  select: Select;
  draw: Draw;
  modify: Modify;
  currentBasemap: Basemap = "cartographic";
  drawnFeaturesCount = 0;
  lastDeleteHighlightedFeature: Feature;
  bufferEdition: Array<[number, number]> = []; // Array of coordinates
  mintedGeoNfts: Array<Properties> = initMintedGeoNfts;
  isFeatureSelected = false;

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
    const initialZoom = 11;
    const showAttribution = true;
    const initialBasemap = basemaps[this.currentBasemap];
    const map = new Map({
      layers: [
        initialBasemap,
        editLayer,
        previewLayer,
        ecologicalAssets,
        ecologicalAssetsCentroids,
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
      map.forEachFeatureAtPixel(
        e.pixel,
        (feature: Feature<MultiPolygon>, layer) => {
          const layerId = layer.get("id");

          // Delete the feature only if the layer is the edit layer
          if (layerId === "edit-layer") {
            this.confirmAction(
              "Delete feature? This action is permanent",
              () => {
                editLayer.getSource().removeFeature(feature);
                this.drawnFeaturesCount--;

                if (this.editLayerIsEmpty) {
                  this.stateTransition("DRAW_FEATURE");
                }
              }
            );
          }
        }
      );
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
          ? this.lastDeleteHighlightedFeature.setStyle(undefined)
          : (this.lastDeleteHighlightedFeature = undefined);
      }
    });

    // Set selected status
    select.on("select", (e) => {
      this.isFeatureSelected = e.selected.length > 0;
    });

    // Increase the drawn features counter on draw end
    draw.on("drawend", (e) => {
      if (!this.state.matches("edition")) return;

      this.drawnFeaturesCount++;
    });

    // Remove the last drawn feature if it intersects with another feature
    editLayer.getSource().on("addfeature", (e) => {
      if (!this.state.matches("edition")) return;

      // Remove the last feature because that is the one just added
      const previousDrawnFeatures = this.editLayer
        .getSource()
        .getFeatures()
        .slice(0, -1);
      const newFeature = e.feature as Feature<MultiPolygon>;
      const isNewCoordinatesIntersect = previousDrawnFeatures.some(
        (previousFeature) => {
          return this.isIntersecting(newFeature, previousFeature);
        }
      );

      if (isNewCoordinatesIntersect) {
        // In case the new polygon intersects with another polygon, remove the last drawn feature
        // and decrease the drawn features counter
        alert("The new polygon cannot intersect with the existing ones");
        this.editLayer.getSource().removeFeature(newFeature);
        this.drawnFeaturesCount--;
      }
    });

    this.map = map;
    this.editLayer = editLayer;
    this.previewLayer = previewLayer;
    this.ecologicalAssets = ecologicalAssets;
    this.select = select;
    this.draw = draw;
    this.modify = modify;
  }

  // UI FUNCTIONS
  public toggleSidebar(): void {
    this.sidebar = !this.sidebar;
  }

  // IDLE FUNCTIONS
  public createEcologicalAsset(): void {
    this.stateTransition("CREATE_ECOLOGICAL_ASSET");
    this.clearSelection();
    this.select.setActive(false);
  }

  public updateSelectedFeature(): void {
    const selectedFeature = this.select
      .getFeatures()
      .getArray()[0] as Feature<MultiPolygon>;

    if (!selectedFeature) return;

    this.backupEditFeature = selectedFeature.clone();

    // Separate each multipolygon part into multiple features
    const selectedFeatureAsPolygons = selectedFeature
      .getGeometry()
      .getCoordinates()[0]
      .map((polygonCoords) => {
        const polygonFeature = new Feature<MultiPolygon>({
          geometry: new MultiPolygon([[polygonCoords]]),
        });
        return polygonFeature;
      });

    this.metadata = selectedFeature.getProperties() as Properties;
    this.editLayer.getSource().addFeatures(selectedFeatureAsPolygons);
    this.ecologicalAssets.getSource().removeFeature(selectedFeature);
    this.sidebar = true;
    this.clearSelection();
    this.select.setActive(false);
    this.stateTransition("UPDATE_ECOLOGICAL_ASSET");
  }

  public createWeatherStation(): void {
    this.stateTransition("CREATE_WEATHER_STATION");
  }

  // METADATA FUNCTIONS
  public cancelMetadata(): void {
    if (this.state.context.mode === "UPDATE") {
      this.revertDrawnFeatures();
    }

    this.metadata = metadataDefaultValues;
    this.select.setActive(true);
    this.clearEditLayer();
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
        if (this.state.context.mode === "CREATE") {
          this.clearEditLayer();
        }

        this.stopDrawing();
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
    this.applyDrawnFeatureToLayer(this.previewLayer);
    this.select.setActive(true);
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
  private clearSelection(): void {
    this.select.getFeatures().clear();
    this.isFeatureSelected = false;
  }

  private startDrawing(): void {
    this.draw.setActive(true);
    this.modify.setActive(false);
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

  private applyDrawnFeatureToLayer(
    targetLayer: VectorLayer<VectorSource<Geometry>>
  ): void {
    // Join all polygon features into a single multipolygon feature
    const newMultiPolygonFeature = new Feature<MultiPolygon>({
      geometry: new MultiPolygon([
        this.editLayer
          .getSource()
          .getFeatures()
          .map((feature) => feature.getGeometry().getCoordinates()[0][0]),
      ]),
    });
    newMultiPolygonFeature.setStyle(undefined);
    targetLayer.getSource().addFeature(newMultiPolygonFeature);
    this.clearEditLayer();
  }

  private revertDrawnFeatures(): void {
    this.backupEditFeature.setStyle(undefined);
    this.ecologicalAssets.getSource().addFeature(this.backupEditFeature);
    this.backupEditFeature = null;
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

  public formatDate(stringDate: string): string {
    return new Date(stringDate).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  public isIntersecting(
    feature1: Feature<MultiPolygon>,
    feature2: Feature<MultiPolygon>
  ): boolean {
    const multiPolygonCoordinates1 = feature1.getGeometry().getCoordinates();
    const multiPolygonCoordinates2 = feature2.getGeometry().getCoordinates();

    const intersects = turfBooleanIntersects(
      turfMultiPolygon(multiPolygonCoordinates1),
      turfMultiPolygon(multiPolygonCoordinates2)
    );
    return intersects;
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
  public get isMetadataWsState(): boolean {
    return this.state.value === "metadataWs";
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
