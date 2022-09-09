import { inject } from "aurelia-framework";
import Draw from 'ol/interaction/Draw';
import GeoJSON from 'ol/format/GeoJSON';
import Circle from 'ol/geom/Circle';
import FeatureOl from 'ol/Feature';
import { fromLonLat } from "ol/proj";
import Map from 'ol/Map';
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
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

type Layer = VectorLayer<VectorSource<Geometry>>;
type Basemap = "cartographic" | "satellite";
type Status = "idle" | "drawing" | "metadata" | "preview";

// Basemaps
// OpenStreet Maps
const cartographicBasemap = new TileLayer({
  source: new OSM(),
});

// Google Maps
const satelliteBasemap = new TileLayer({
  source: new XYZ({
    urls: [
      "http://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      "http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      "http://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      "http://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
    ]
  }),
});

const basemaps: Record<Basemap, TileLayer<OSM | XYZ>> = {
  "cartographic": cartographicBasemap,
  "satellite": satelliteBasemap,
}

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
  cartographicBasemap: TileLayer<OSM>;
  satelliteBasemap: TileLayer<XYZ>;


  public attached(): void {
    const initialCenter = [-68.95, 12.138];
    const initialZoom = 7;

    const editStyle = new Style({
      fill: new Fill({
        color: [245, 203, 66, 0.3]
      }),
      stroke:  new Stroke({
        color: [189, 147, 9],
        width: 2,
      })
    });
    const editSource = new VectorSource();
    const editLayer = new VectorLayer({
      source: editSource,
      style: editStyle,
    });

    const previewStyle = new Style({
      fill: new Fill({
        color: [245, 203, 66, 0.3]
      }),
      stroke:  new Stroke({
        color: [189, 147, 9],
        width: 2,
      })
    });
    const previewLayer = new VectorLayer({
      source: new VectorSource(),
      style: previewStyle,
    });

    const testLayer = new VectorLayer({
      source: new VectorSource({
        features: new GeoJSON({ featureProjection: "EPSG:3857" }).readFeatures(testGeoJSON),
      }),
    });
    
    const initBasemap = basemaps[this.currentBasemap];
    const map = new Map({
      layers: [initBasemap, editLayer, testLayer],
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
    this.editLayer = editLayer;
    this.previewLayer = previewLayer;
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
    newBasemapLayer.setZIndex(-1);
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
