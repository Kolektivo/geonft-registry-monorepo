import { inject } from "aurelia-framework";
import Draw from 'ol/interaction/Draw';
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
import "ol/ol.css";
import { 
  weatherStationsGeoJSON, 
  foodforestsGeoJSON, 
  testGeoJSON 
} from "./map-component.data";
import "./map-component.scss";
import { Feature, FeatureCollection } from "geojson";
import TileLayer from "ol/layer/Tile";
import { Geometry } from "ol/geom";

type Basemap = "cartographic" | "satellite";
type Layer = VectorLayer<VectorSource<Geometry>>

// const cartographicBasemap: L.TileLayer = L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
//   maxZoom: 19,
//   attribution: '© OpenStreetMap'
// });
// const satelliteBasemap: L.TileLayer = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
//   maxZoom: 20,
//   subdomains:['mt0','mt1','mt2','mt3']
// });

// const basemaps: Record<Basemap, L.TileLayer> = {
//   "cartographic": cartographicBasemap,
//   "satellite": satelliteBasemap,
// }

@inject(Element)
export class MapComponent {
  public mapDiv: HTMLDivElement;
  map: Map;
  editLayer: Layer;
  previewLayer: Layer;
  testLayer: Layer;
  draw: Draw;
  select: Select;
  currentBasemap: Basemap = "cartographic";

  public attached(): void {
    const initialCenter = [-68.95, 12.138];
    const initialZoom = 7;

    const osm = new TileLayer({
      source: new OSM(),
    });

    const editStyle = new Style({
      fill: new Fill({
        color: '#ff0000',
      }),
    });
    const editSource = new VectorSource();
    const editLayer = new VectorLayer({
      source: editSource,
      style: editStyle,
    });

    const testLayer = new VectorLayer({
      source: new VectorSource({
        features: new GeoJSON({ featureProjection: "EPSG:3857" }).readFeatures(testGeoJSON),
      }),
    });
    
    const map = new Map({
      layers: [osm, editLayer, testLayer],
      target: 'map',
      view: new View({
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

    const draw = new Draw({
      source: editSource,
      type: "MultiPolygon"
    });
    draw.setActive(false);
    map.addInteraction(draw);

    function selectStyle(feature) {
      const color = feature.get('COLOR') || '#eeeeee';
      selected.getFill().setColor(color);
      return selected;
    }

    // select interaction working on "singleclick"
    const select = new Select({ 
      style: selectStyle,
      layers: [testLayer], 

    });

    map.addInteraction(select);

    this.map = map;
    this.draw = draw;
    this.select = select;
  }

  public startEdition(): void {
    this.draw.setActive(true);
    this.map.removeInteraction(this.select);
  }

  public finishEdition(): void {
    this.draw.setActive(false);
    this.select.setActive(false);
    this.showMetadataForm();
  }

  public cancelEdition(): void {
    this.draw.abortDrawing();
    this.draw.setActive(false);
    this.map.addInteraction(this.select);
    this.editLayer.getSource().clear();
  }

  private applyDrawnFeaturesToLayer(targetLayer: Layer): void {
    const drawnFeatures = this.editLayer.getSource().getFeatures();
    this.editLayer.getSource().clear();
    targetLayer.getSource().addFeatures(drawnFeatures);
  }

  private showMetadataForm(): void {
    const formDataElement = document.getElementById("form-data");
    formDataElement.style.display = "block";
  }

  private hideMetadataForm(): void {
    const formDataElement = document.getElementById("form-data");
    formDataElement.style.display = "none";
  }

  public sendValue(): void {
    const valueInputElement = document.getElementById("form-value") as HTMLInputElement;
    const value = valueInputElement.value;
    console.log("FORM VALUE: ", value);
    this.hideMetadataForm();
    this.applyDrawnFeaturesToLayer(this.previewLayer);
  }

  public closeDataBox(): void {
    const featureDataBoxElement = document.getElementById("feature-data-box");
    featureDataBoxElement.style.display = "none";
  }
}
