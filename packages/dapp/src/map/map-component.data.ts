export const foodforestsGeoJSON = {
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
}

export const weatherStationsGeoJSON = {
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
}