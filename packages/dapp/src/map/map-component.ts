import { inject } from "aurelia-framework";
import L from "leaflet";
import "leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { weatherStationsGeoJSON, foodforestsGeoJSON } from "./map-component.data";
import "./map-component.scss";


@inject(Element)
export class MapComponent {
  public mapDiv: HTMLDivElement;
  map: any;

  public attached(): void {
    const initialState = { lng: -68.95, lat: 12.138, zoom: 7 };

    const map = L.map("map").setView(
      [initialState.lat, initialState.lng,], initialState.zoom
    );

    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    const drawnItems = new L.FeatureGroup().addTo(map);
    
    new L.Control.Draw({
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
}
