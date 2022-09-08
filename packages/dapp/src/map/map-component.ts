import { inject } from "aurelia-framework";
import L, { FeatureGroup, Layer, layerGroup, LayerGroup, PathOptions } from "leaflet";
import GeoJSON from 'ol/format/GeoJSON';
import Circle from 'ol/geom/Circle';
import FeatureOl from 'ol/Feature';
import { fromLonLat } from "ol/proj";
import Map from 'ol/Map';
import OSM from "ol/source/OSM";
import Select from 'ol/interaction/Select';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';
import { Fill, Stroke, Style } from 'ol/style';
import { altKeyOnly, click, pointerMove } from 'ol/events/condition';
import "ol/ol.css";
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
import TileLayer from "ol/layer/Tile";

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
  map: Map;
  select: Select | null;
  currentBasemap: Basemap = "cartographic";

  public attached(): void {
    const initialCenter = [-68.95, 12.138];
    const initialZoom = 7;

    const style = new Style({
      fill: new Fill({
        color: '#eeeeee',
      }),
    });
    
    const vectorSource = new VectorSource({
      features: new GeoJSON({ featureProjection: "EPSG:3857"}).readFeatures(testGeoJSON),
    });
    
    vectorSource.addFeature(new FeatureOl(new Circle([5e6, 7e6], 1e6)));

    const osm = new TileLayer({
      source: new OSM(),
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });
    
    const map = new Map({
      layers: [osm, vectorLayer],
      target: 'map',
      view: new View({
        // projection: "EPSG:4326",
        center: fromLonLat(initialCenter),
        zoom: initialZoom,
      }),
    });

    const selected = new Style({
      fill: new Fill({
        color: '#eeeeee',
      }),
      stroke: new Stroke({
        color: 'rgba(255, 255, 255, 0.7)',
        width: 2,
      }),
    });

    function selectStyle(feature) {
      const color = feature.get('COLOR') || '#eeeeee';
      selected.getFill().setColor(color);
      return selected;
    }

    // select interaction working on "singleclick"
    const select = new Select({ style: selectStyle });
    select.on("select", (e) => {
      console.log("SELECT: ", e);
    });

    map.addInteraction(select);
  }

  public closeDataBox(): void {
    const featureDataBoxElement = document.getElementById("feature-data-box");
    featureDataBoxElement.style.display = "none";
  }
}
