import { inject } from "aurelia-framework";
import L, { FeatureGroup, Layer, layerGroup, LayerGroup, PathOptions } from "leaflet";
import "leaflet-draw";
import "leaflet/dist/leaflet.css";
// import "leaflet-draw/dist/leaflet.draw.css";
import '@geoman-io/leaflet-geoman-free';  
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'; 
import { 
  weatherStationsGeoJSON, 
  foodforestsGeoJSON, 
  testGeoJSON 
} from "./map-component.data";
import "./map-component.scss";
import { Feature, FeatureCollection } from "geojson";

type Basemap = "cartographic" | "satellite";

const cartographicBasemap: L.TileLayer = L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
});
const satelliteBasemap: L.TileLayer = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
  maxZoom: 20,
  subdomains:['mt0','mt1','mt2','mt3']
});

const basemaps: Record<Basemap, L.TileLayer> = {
  "cartographic": cartographicBasemap,
  "satellite": satelliteBasemap,
}

const defaultStyle: PathOptions = {
  color: "blue",
  fillColor: "blue",
  fillOpacity: 0.2,
}

const hoverStyle: PathOptions = {
  fillColor: "red",
  fillOpacity: 0.3,
}

const selectStyle: PathOptions = {
  color: "#34e1eb", // turquoise
  fillColor: "yellow",
  fillOpacity: 0.8,
}

const drawStyle: PathOptions = {
  color: "red", // turquoise
  fillColor: "red",
  fillOpacity: 0.3,
}

const tempStyle: PathOptions = {
  color: "purple",
  fillColor: "green",
  fillOpacity: 1,
}

@inject(Element)
export class MapComponent {
  public mapDiv: HTMLDivElement;
  map: L.DrawMap;
  currentBasemap: Basemap = "cartographic";
  selectedFeature: FeatureGroup<FeatureCollection> | null = null;
  editBackupLayerCoords: any;
  editLayer: L.GeoJSON;
  editLayer2: FeatureGroup<L.Polygon>;
  tempLayer: FeatureGroup<L.Polygon>;
  isEditing: boolean;

  public attached(): void {
    const initialState = { lng: -68.95, lat: 12.138, zoom: 7 };

    const map = L.map("map").setView(
      [initialState.lat, initialState.lng,], initialState.zoom
    );

    const initBasemap = basemaps[this.currentBasemap];
    initBasemap.addTo(map);

    // Food forest layer
    new L.GeoJSON(foodforestsGeoJSON, {
      pmIgnore: true
    }).addTo(map);
    // Weather stations layer
    new L.GeoJSON(weatherStationsGeoJSON, {
      pointToLayer: (_, latlng) => {
        const icon = new L.Icon({
          iconUrl: "/kolektivo_sun.png",
          iconSize: [24, 24],
        });
        return L.marker(latlng, { 
          icon, 
          pmIgnore: true
        });
      }
    }).addTo(map);

    this.editLayer = new L.GeoJSON(testGeoJSON, {
      // https://leafletjs.com/reference.html#path-option
      style: () => defaultStyle,
      onEachFeature: (feature, layer) => {
        const label: string = feature.properties.name;
        layer.bindTooltip(label);
      }
    }).addTo(map);

    this.tempLayer = new L.FeatureGroup().addTo(map);
    this.editLayer2 = new L.FeatureGroup().addTo(map);

    // Define drawing toolbar and hiding some of them
    map.pm.addControls({  
      position: 'topleft',  
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawText: false,
    });

    map.pm.setGlobalOptions({
      continueDrawing: true,
      layerGroup: this.editLayer2,
      pathOptions: drawStyle,
    });

    this.editLayer.on("mouseover", (e: L.LeafletMouseEvent) => {
      const feature: FeatureGroup = e.layer;
      const featureId = this.editLayer.getLayerId(feature);

      if (isSelectedFeature(featureId)) return;

      feature.setStyle(hoverStyle);
    });

    this.editLayer.on("mouseout", (e: L.LeafletMouseEvent) => {
      const feature: FeatureGroup = e.layer;
      const featureId = this.editLayer.getLayerId(feature);

      if (isSelectedFeature(featureId)) return;
      this.editLayer.resetStyle(feature);
    });

    
    const isSelectedFeature = (layerId: number): boolean => {
      if (!this.selectedFeature) return false;
      
      const selectedFeatureId = this.editLayer.getLayerId(this.selectedFeature);
      return selectedFeatureId === layerId;
    }
    
    this.map = map;
    this.isEditing = false;
    this.editLayer.on("click", (e: L.LeafletMouseEvent) => {
      if (this.isEditing) return;

      const feature: FeatureGroup = e.layer;
      const featureId = this.editLayer.getLayerId(feature);
      feature.setStyle(selectStyle);
      
      if (this.selectedFeature) {
        this.selectedFeature.setStyle(defaultStyle);
      }
  
      this.selectedFeature = this.editLayer.getLayer(featureId) as FeatureGroup;
      this.displayData();
    });
  }

  private deselectFeature(): void {
    this.selectedFeature.setStyle(defaultStyle);
    this.selectedFeature = null;
  }

  public toggleBasemap(): void {
    const newBasemap: Basemap = this.currentBasemap === "cartographic"
      ? "satellite"
      : "cartographic";
    const oldBasemapLayer = basemaps[this.currentBasemap];
    const newBasemapLayer = basemaps[newBasemap];

    this.map.addLayer(newBasemapLayer);
    this.map.removeLayer(oldBasemapLayer);
    this.currentBasemap = newBasemap;
  }

  public editFeature() {
    this.isEditing = true;
    const featureId = this.editLayer.getLayerId(this.selectedFeature);
    const layer = this.editLayer.getLayer(featureId) as L.Polygon;
    this.editBackupLayerCoords = layer.getLatLngs();
    console.log("SELECTED FEATURE: ", this.selectedFeature);
    console.log("LAYER: ", layer);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // this.editBackupLayerCoords = this.selectedFeature._latlngs;
    console.log("ORIG LATLNGS: ", this.editBackupLayerCoords);
    // this.editBackupLayerCoords = this.selectedFeature;
    this.selectedFeature.pm.enable();
  }

  public startEdition() {
    this.isEditing = true;
    this.map.pm.enableDraw("Polygon");
  }

  public finishEdition() {
    if (this.selectedFeature) {
      this.selectedFeature.pm.disable();
    }

    this.map.pm.disableDraw();
    this.isEditing = false;
    const formDataElement = document.getElementById("form-data");
    formDataElement.style.display = "block";
  }

  public sendValue() {
    const valueInputElement = document.getElementById("form-value") as HTMLInputElement;
    const value = valueInputElement.value;
    console.log("FORM VALUE: ", value);

    const formDataElement = document.getElementById("form-data");
    formDataElement.style.display = "none";

    const drawnLayers = this.editLayer2.getLayers();
    drawnLayers.forEach((layer: L.Polygon) => {
      this.tempLayer.addLayer(layer);
      layer.addTo(this.map);
      layer.setStyle(tempStyle);
    });
    console.log("TEMP LAYER: ", this.tempLayer);
    console.log("EDIT LAYER 2: ", this.editLayer2);
    this.editLayer2.clearLayers();
  }

  public cancelEdition() {
    // this.selectedFeature.pm.disable();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // console.log("NEW LATLNGS: ", this.selectedFeature._latlngs);
    // console.log("ORIG LATLNGS???: ", this.editBackupLayerCoords);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // const featureId = this.editLayer.getLayerId(this.selectedFeature);
    // const layer = this.editLayer.getLayer(featureId) as L.Polygon;
    // layer.setLatLngs(this.editBackupLayerCoords);
    this.map.pm.disableDraw();
    this.editLayer2.clearLayers();
    // this.selectedFeature = this.editBackupLayerCoords;

    // console.log("SELECTED FEATURE: ", this.selectedFeature);
  }

  private displayData(): void {
    const featureDataBoxElement = document.getElementById("feature-data-box");
    const featureDataElement = document.getElementById("feature-data");
    const feature = this.selectedFeature.feature as Feature;
    featureDataBoxElement.style.display = "block";
    featureDataElement.innerHTML = feature.properties.description;
  }

  public closeDataBox(): void {
    const featureDataBoxElement = document.getElementById("feature-data-box");
    featureDataBoxElement.style.display = "none";
  }
}
