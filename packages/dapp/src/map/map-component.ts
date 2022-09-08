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
type LayerName = "EDIT" | "TEST";
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
  draw: Draw;
  select: Select;
  currentBasemap: Basemap = "cartographic";

  public attached(): void {
    const initialCenter = [-68.95, 12.138];
    const initialZoom = 7;

    const osm = new TileLayer({
      source: new OSM(),
    });
    
    const LAYER_NAME_ATTRIBUTE = "name";
    const EDIT_LAYER_NAME: LayerName = "EDIT";
    const TEST_LAYER_NAME: LayerName = "TEST";

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
    editLayer.set(LAYER_NAME_ATTRIBUTE, EDIT_LAYER_NAME);

    const testLayer = new VectorLayer({
      source: new VectorSource({
        features: new GeoJSON({ featureProjection: "EPSG:3857" }).readFeatures(testGeoJSON),
      }),
    });
    testLayer.set(LAYER_NAME_ATTRIBUTE, TEST_LAYER_NAME);
    
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
    select.on("select", (e) => {
      console.log("SELECT: ", e);
    });

    map.addInteraction(select);

    this.map = map;
    this.draw = draw;
    this.select = select;
  }

  private getLayer(name: LayerName): Layer {
    let layer: Layer | undefined;

    this.map.getLayers().forEach(mapLayer => {
      if (mapLayer.get("name") === name && mapLayer instanceof VectorLayer) {
        layer = mapLayer;
      }
    });
    return layer;
  }

  public startEdition(): void {
    this.draw.setActive(true);
    this.map.removeInteraction(this.select);
  }

  public finishEdition(): void {
    this.draw.finishDrawing();
    this.select.setActive(false);
    const editLayer = this.getLayer("EDIT");
    const testLayer = this.getLayer("TEST");
    const drawnFeatures = editLayer.getSource().getFeatures();
    editLayer.getSource().clear();
    testLayer.getSource().addFeatures(drawnFeatures);
  }

  public cancelEdition(): void {
    this.draw.abortDrawing();
    this.draw.setActive(false);
    this.map.addInteraction(this.select);
    
    const editLayer = this.getLayer("EDIT");
    editLayer.getSource().clear();
  }

  public closeDataBox(): void {
    const featureDataBoxElement = document.getElementById("feature-data-box");
    featureDataBoxElement.style.display = "none";
  }
}
