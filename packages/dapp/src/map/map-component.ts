import { inject } from "aurelia-framework";
import L, { FeatureGroup, Layer, LayerGroup, PathOptions } from "leaflet";
import "leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
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

@inject(Element)
export class MapComponent {
  public mapDiv: HTMLDivElement;
  map: L.DrawMap;
  currentBasemap: Basemap = "cartographic";
  selectedFeature: FeatureGroup<FeatureCollection> | null = null;

  public attached(): void {
    const initialState = { lng: -68.95, lat: 12.138, zoom: 7 };

    const map = L.map("map").setView(
      [initialState.lat, initialState.lng,], initialState.zoom
    );

    const initBasemap = basemaps[this.currentBasemap];
    initBasemap.addTo(map);

    const drawnItems = new L.FeatureGroup().addTo(map);

    map.on(L.Draw.Event.CREATED, (e) => {
      // Marked as deprecated but only way to work
      const { layer } = e;
      drawnItems.addLayer(layer);
    });

    const foodForestLayer = new L.GeoJSON(foodforestsGeoJSON).addTo(map);
    const weatherStationsLayer = new L.GeoJSON(weatherStationsGeoJSON, {
      pointToLayer: (_, latlng) => {
        const icon = new L.Icon({
          iconUrl: "/kolektivo_sun.png",
          iconSize: [24, 24],
        });
        return L.marker(latlng, { icon, });
      }
    }).addTo(map);
    const testLayer = new L.GeoJSON(testGeoJSON, {
      // https://leafletjs.com/reference.html#path-option
      style: () => defaultStyle,
      onEachFeature: (feature, layer) => {
        const label: string = feature.properties.name;
        layer.bindTooltip(label);
      }
      
    }).addTo(map);

    // Define drawing toolbar and hiding some of them
    new L.Control.Draw({
      draw: {
        polyline: false,
        circle: false,
        circlemarker: false,
        rectangle: false,
      },
      edit: {
        featureGroup: drawnItems,
      }
    }).addTo(map);

    testLayer.on("mouseover", (e: L.LeafletMouseEvent) => {
      const feature: FeatureGroup = e.layer;
      const featureId = testLayer.getLayerId(feature);

      if (isSelectedFeature(featureId)) return;

      feature.setStyle(hoverStyle);
    });

    testLayer.on("mouseout", (e: L.LeafletMouseEvent) => {
      const feature: FeatureGroup = e.layer;
      const featureId = testLayer.getLayerId(feature);

      if (isSelectedFeature(featureId)) return;
      testLayer.resetStyle(feature);
    });

    testLayer.on("click", (e: L.LeafletMouseEvent) => {
      const feature: FeatureGroup = e.layer;
      const featureId = testLayer.getLayerId(feature);
      feature.setStyle(selectStyle);
      
      if (this.selectedFeature) {
        this.selectedFeature.setStyle(defaultStyle);
      }

      this.selectedFeature = testLayer.getLayer(featureId) as FeatureGroup;
      this.displayData();
    });

    const isSelectedFeature = (layerId: number): boolean => {
      if (!this.selectedFeature) return false;

      const selectedFeatureId = testLayer.getLayerId(this.selectedFeature);
      return selectedFeatureId === layerId;
    }

    this.map = map;
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
    this.deselectFeature();
  }
}
