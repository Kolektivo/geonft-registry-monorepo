import { inject, LogManager, View } from "aurelia-framework";
import { Logger } from "aurelia-logging";
import { Map, NavigationControl, Popup } from "maplibre-gl";
import { default as mapEnv } from '../../config/map.json';
import "./map-component.scss";

@inject(Element)
export class MapComponent {
  private logger: Logger = LogManager.getLogger("components.map");

  private element: HTMLElement;

  public mapDiv: HTMLDivElement;
  map: Map | undefined;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  public created(owningView: View, myView: View): void {
    this.logger.info("Created");
  }

  public bind(bindingContext, overrideContext): void {
    this.logger.debug("Bind");
  }

  public attached(): void {
    const initialState = { lng: -428.95, lat: 12.138, zoom: 12 };

    this.logger.debug(mapEnv.apiKey);

    this.map = new Map({
      container: this.mapDiv,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${mapEnv.apiKey}`,
      center: [initialState.lng, initialState.lat],
      zoom: initialState.zoom,
    });

    this.map.addControl(new NavigationControl());

    this.map.on('load', () => {
      if (this.map) {
        this.map.loadImage(
          '/kolektivo_sun.png',
          (error, image: HTMLImageElement | ArrayBufferView | { width: number; height: number; data: Uint8Array | Uint8ClampedArray; } | ImageData | ImageBitmap) => {
          if (error) throw error;
          if (this.map) {
            // Add the image to the map style.
            this.map.addImage('sun', image);

            this.map.addSource('weatherstations', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: [
                  {
                    type: 'Feature',
                    properties: {
                      name: 'Dinah Veeris Food Forest (sensorID: 3A)',
                      description:
                        'stationID: IWILLE45<br>time: 2022-03-28 11:34:55<br>humidity:67<br>temp:29<br>windSpeed:9<br>windGust:15',
                      icon: 'sun',
                      iconSize: [75, 45],
                    },
                    geometry: {
                      type: 'Point',
                      coordinates: [-68.822, 12.094],
                    },
                  },
                  {
                    type: 'Feature',
                    properties: {
                      name: 'Scherpenheuvel Boye Farm (sensorID: 0E)',
                      description:
                        'stationID: IWILLE44<br>time: 2022-03-28 11:34:55<br>humidity:67<br>temp:29<br>windSpeed:9<br>windGust:15',
                      icon: 'sun',
                      iconSize: [75, 45],
                    },
                    geometry: {
                      type: 'Point',
                      coordinates: [-68.87, 12.11],
                    },
                  },
                  {
                    type: 'Feature',
                    properties: {
                      name: "Klarvin's Food Forest - Galactic Farm Station (Barber bou) (sensorID: C2)",
                      description:
                        'stationID: IBOUBA1<br>time: 2022-03-28 11:34:55<br>humidity:67<br>temp:29<br>windSpeed:9<br>windGust:15',
                      icon: 'sun',
                      iconSize: [75, 45],
                    },
                    geometry: {
                      type: 'Point',
                      coordinates: [-69.1, 12.29],
                    },
                  },
                ],
              },
            });

            this.map.addLayer({
              id: 'weatherstations',
              type: 'symbol',
              source: 'weatherstations',
              layout: {
                'icon-image': '{icon}',
                'icon-size': 0.05,
                'icon-allow-overlap': true,
              },
            });

            this.map.on('click', 'weatherstations', (e) => {
              if (this.map && e.features && e.features[0].geometry.type === 'Point') {
                // Copy coordinates array.
                const coordinates = e.features[0].geometry.coordinates.slice();
                const description = e.features[0].properties['description'];

                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                  coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                new Popup()
                  .setLngLat([coordinates[0], coordinates[1]])
                  .setHTML(description)
                  .addTo(this.map);
              }
            });

            // Change the cursor to a pointer when the mouse is over the places layer.
            this.map.on('mouseenter', 'weatherstations', () => {
              if (this.map) {
                this.map.getCanvas().style.cursor = 'pointer';
              }
            });

            // Change it back to a pointer when it leaves.
            this.map.on('mouseleave', 'weatherstations', () => {
              if (this.map) {
                this.map.getCanvas().style.cursor = '';
              }
            });

          }
        });

          this.map.loadImage(
            '/kolektivo_tree_green.png',
            (error, image2: HTMLImageElement | ArrayBufferView | { width: number; height: number; data: Uint8Array | Uint8ClampedArray; } | ImageData | ImageBitmap) => {
            if (error) throw error;
            if (this.map) {
              // Add the image to the map style.
            this.map.addImage('image_tree_green', image2);

            this.map.addSource('foodforests', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: [
                  {
                    type: 'Feature',
                    properties: {
                      name: 'Food Forest 1',
                      description:
                        'Food Forest 1<br><img width=\'200\' src=\'\\ff1.jpg\'><br>300 m²<br>3-4 Managers<br>Established in 2018',
                      icon: 'image_tree_green',
                      status: 'approved'
                    },
                    geometry: {
                      type: 'Polygon',
                      coordinates: [
                        [
                          [
                            -428.93541499972343,
                            12.110363491120767
                          ],
                          [
                            -428.93546998500824,
                            12.110321530841098
                          ],
                          [
                            -428.9354766905307,
                            12.110244166558177
                          ],
                          [
                            -428.9354056119919,
                            12.110210073816223
                          ],
                          [
                            -428.935339897871,
                            12.110244166558177
                          ],
                          [
                            -428.93533587455744,
                            12.110329398394029
                          ],
                          [
                            -428.93541499972343,
                            12.110363491120767
                          ]
                        ]
                      ]
                    },
                  },
                  {
                    type: 'Feature',
                    properties: {
                      name: 'Food Forest 2',
                      description:
                        'pending',
                      icon: 'image_tree_green',
                      status: 'pending'
                    },
                    geometry: {
                      type: 'MultiPolygon',
                      coordinates: [
                        [
                          [
                            [
                              -428.8906744122505,
                              12.147418397582491
                            ],
                            [
                              -428.8907468318939,
                              12.147347599447487
                            ],
                            [
                              -428.8907213509083,
                              12.14723615790054
                            ],
                            [
                              -428.8905939459801,
                              12.147198136656193
                            ],
                            [
                              -428.89051884412766,
                              12.147280734524921
                            ],
                            [
                              -428.89055103063583,
                              12.147379065287602
                            ],
                            [
                              -428.8906744122505,
                              12.147418397582491
                            ]
                          ],
                        ],
                        [
                          [
                            [
                              -428.8905443251133,
                              12.147381687440772
                            ],
                            [
                              -428.89051616191864,
                              12.147279423447841
                            ],
                            [
                              -428.89041021466255,
                              12.147224358204612
                            ],
                            [
                              -428.8903096318245,
                              12.147300400680368
                            ],
                            [
                              -428.8903257250786,
                              12.147409220047532
                            ],
                            [
                              -428.8904584944248,
                              12.147449863414236
                            ],
                            [
                              -428.8905443251133,
                              12.147381687440772
                            ]
                          ],
                        ],
                        [
                          [
                            [
                              -428.8901272416115,
                              12.147367265597998
                            ],
                            [
                              -428.89017820358276,
                              12.147195514501217
                            ],
                            [
                              -428.8900186121464,
                              12.147116849839737
                            ],
                            [
                              -428.8899327814579,
                              12.147217802817746
                            ],
                            [
                              -428.8899743556976,
                              12.147334488679682
                            ],
                            [
                              -428.8901272416115,
                              12.147367265597998
                            ]
                          ],
                        ],
                      ]
                    },
                  },
                ],
              },
            });

            this.map.addLayer({
              id: 'foodforests-icon',
              type: 'symbol',
              source: 'foodforests',
              maxzoom: 16,
              layout: {
                'icon-image': '{icon}',
                'icon-size': .5,
                'icon-allow-overlap': true,
              },
            });

            this.map.addLayer({
              id: 'foodforests-approved',
              type: 'fill',
              source: 'foodforests',
              minzoom: 16,
              paint: {
                'fill-outline-color': '#000',
                'fill-color': 'green',
                'fill-opacity': .5
              },
              'filter': ['==', ['get', 'status'], 'approved']
            });

            this.map.on('click', 'foodforests-approved', (e) => {
              if (this.map && e.features) {
                const description = e.features[0].properties['description'];

                new Popup()
                  .setLngLat(e.lngLat)
                  .setHTML(description)
                  .addTo(this.map);
              }
            });

            this.map.addLayer({
              id: 'foodforests-pending',
              type: 'fill',
              source: 'foodforests',
              minzoom: 16,
              paint: {
                'fill-outline-color': '#000',
                'fill-color': 'yellow',
                'fill-opacity': .5
              },
              'filter': ['==', ['get', 'status'], 'pending']
            });

            this.map.on('click', 'foodforests-pending', (e) => {
              if (this.map && e.features) {
                const description = e.features[0].properties['description'];

                new Popup()
                  .setLngLat(e.lngLat)
                  .setHTML(description)
                  .addTo(this.map);
              }
            });
          }
        });
      }
    });
    this.logger.debug("Attached");
  }

  public detached(): void {
    this.logger.debug("Detached");
  }

  public unbind(): void {
    this.logger.debug("Unbind");
  }

}
