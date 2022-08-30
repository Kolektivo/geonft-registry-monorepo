import { inject } from "aurelia-framework";
import L from "leaflet";
import "leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
// import { weatherStationsGeoJSON, foodforestsGeoJSON } from "./map-component.data";
import "./map-component.scss";

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

@inject(Element)
export class MapComponent {
  public mapDiv: HTMLDivElement;
  map: L.DrawMap;
  currentBasemap: Basemap = "cartographic";

  public attached(): void {
    const initialState = { lng: -68.95, lat: 12.138, zoom: 7 };

    const map = L.map("map").setView(
      [initialState.lat, initialState.lng,], initialState.zoom
    );

    const initBasemap = basemaps[this.currentBasemap];
    initBasemap.addTo(map);

    const drawnItems = new L.FeatureGroup().addTo(map);
    
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

    map.on(L.Draw.Event.CREATED, (e) => {
      // Marked as deprecated but only way to work
      const { layer } = e;
      drawnItems.addLayer(layer);
    });

    this.map = map;
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
}
