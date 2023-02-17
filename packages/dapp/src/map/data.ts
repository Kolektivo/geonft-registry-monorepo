import { FeatureCollection, MultiPolygon } from "geojson";
import { v4 as uuidv4 } from "uuid";

export const ecologicalAssetsGeoJSON: FeatureCollection<
  MultiPolygon,
  Properties
> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: uuidv4(),
        registered: true,
        name: "Ecological asset 1",
        description: "his is the ecological assets of Curazao nº 1",
        locationAddress: "",
        email: "test@email.com",
        phoneNumber: 666777888,
        numberManagers: undefined,
        date: new Date("2022-10-02").toISOString().split("T")[0],
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [-69.14726257324219, 12.35475861486504],
              [-69.136962890625, 12.343355720970964],
              [-69.14314270019531, 12.320548443734884],
              [-69.13558959960938, 12.3118274899455],
              [-69.11636352539, 12.3118274899455],
              [-69.099884033203, 12.317865104207353],
              [-69.07997131347656, 12.31853594166211],
              [-69.07585144042969, 12.321219274328346],
              [-69.07859802246094, 12.352746375577963],
              [-69.10400390625, 12.358783046999035],
              [-69.11842346191405, 12.366161011703085],
              [-69.13421630859374, 12.368843856323089],
              [-69.14520263671875, 12.368843856323089],
              [-69.14726257324219, 12.35475861486504],
            ],
            [
              [-69.10331726074219, 12.305118866797503],
              [-69.10400390625, 12.296397400559249],
              [-69.09576416015625, 12.295726506552372],
              [-69.071044921875, 12.295055610833273],
              [-69.06898498535156, 12.306460605137405],
              [-69.07997131347656, 12.311156635343673],
              [-69.09576416015625, 12.311156635343673],
              [-69.10331726074219, 12.305118866797503],
            ],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: uuidv4(),
        registered: true,
        name: "Ecological asset 2",
        description: "his is the ecological assets of Curazao nº 2",
        locationAddress: "",
        email: "test2@email.com",
        phoneNumber: 111222333,
        numberManagers: undefined,
        date: new Date("2022-10-05").toISOString().split("T")[0],
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [-68.851318359375, 12.167554457941991],
              [-68.86573791503906, 12.157485962814572],
              [-68.85612487792969, 12.147417086506097],
              [-68.84307861328125, 12.142718147196954],
              [-68.83209228515625, 12.144731988484425],
              [-68.83209228515625, 12.1548009663911],
              [-68.851318359375, 12.167554457941991],
            ],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        id: uuidv4(),
        registered: false,
        name: "Ecological asset 3",
        description: "his is the ecological assets of Curazao nº 3",
        locationAddress: "",
        email: "test3@email.com",
        phoneNumber: 999888777,
        numberManagers: undefined,
        date: new Date("2022-10-14").toISOString().split("T")[0],
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [-68.74802112579346, 12.05426196302629],
              [-68.74995231628418, 12.055730876526113],
              [-68.75038146972656, 12.055772845365073],
              [-68.75231266021729, 12.053758333689268],
              [-68.75222682952881, 12.052583194893447],
              [-68.74857902526855, 12.049813204513864],
              [-68.7438154220581, 12.045951958107095],
              [-68.74059677124023, 12.044776785134534],
              [-68.73913764953613, 12.044441020483413],
              [-68.7383222579956, 12.04502860834735],
              [-68.7394380569458, 12.047169096120564],
              [-68.74802112579346, 12.05426196302629],
            ],
            [
              [-68.74926567077637, 12.044608902861453],
              [-68.75128269195557, 12.046119839540447],
              [-68.75196933746338, 12.045909987732346],
              [-68.75699043273926, 12.042762190930587],
              [-68.7562608718872, 12.042216569066266],
              [-68.75510215759277, 12.041922772218683],
              [-68.75385761260986, 12.041377148649115],
              [-68.75274181365965, 12.041377148649115],
              [-68.75093936920166, 12.041419119732275],
              [-68.7509822845459, 12.042426423760645],
              [-68.75012397766112, 12.042972045198644],
              [-68.74978065490721, 12.043769489921708],
              [-68.74926567077637, 12.044608902861453],
            ],
            [
              [-68.76668930053711, 12.043979343402642],
              [-68.76467227935791, 12.044231167363282],
              [-68.76317024230957, 12.044231167363282],
              [-68.76179695129395, 12.043895402029944],
              [-68.7610673904419, 12.043601607018903],
              [-68.75999450683592, 12.044441020483413],
              [-68.75999450683592, 12.045658165346143],
              [-68.7605094909668, 12.046497572381684],
              [-68.76218318939209, 12.046791364224116],
              [-68.76424312591553, 12.046623483210663],
              [-68.7657880783081, 12.046581512940897],
              [-68.76703262329102, 12.046203780217759],
              [-68.76668930053711, 12.043979343402642],
            ],
          ],
        ],
      },
    },
  ],
};

export interface Properties {
  id?: string;
  registered: boolean;
  name: string;
  description: string;
  locationAddress: string;
  email: string;
  phoneNumber: number;
  numberManagers: number;
  date: string;
}
