import { assign, createMachine, interpret } from "xstate";

// Edition has been modeled as a state machine to handle the different
// states of the edition process. This helps to clarify the possible
// states and transitions between them. Also, it avoids impossible states or transitions.

// The machine has 5 main states:
// - idle: the initial state, where the user can choose to create or update
//   an ecological asset.
// - metadata: the state where the user can fill the metadata of the ecological
//   asset.
// - edition: the state where the user can draw, modify or delete the features of
//   the ecological asset.
// - preview: the state where the user can preview the ecological asset before
//   submitting it.
// - previewWs: the state where the user can preview the weather station before
//   submitting it.
// For mor info about xstate and state machines, see https://xstate.js.org/docs/

// EA = Ecological asset
// WS = Weather station
export type MachineEventsType =
  | "CREATE_ECOLOGICAL_ASSET"
  | "UPDATE_ECOLOGICAL_ASSET"
  | "CREATE_WEATHER_STATION"
  | "CANCEL_METADATA"
  | "SUBMIT_METADATA"
  | "SUBMIT_METADATA_WS"
  | "MODIFY_FEATURE"
  | "DRAW_FEATURE"
  | "DELETE_FEATURE"
  | "EDIT_FEATURES"
  | "CANCEL_EDITION"
  | "FINISH_EDITION"
  | "CANCEL_PREVIEW"
  | "CANCEL_PREVIEW_WS"
  | "MINT_GEONFT";

type MachineContextValues = "CREATE" | "UPDATE";

type MachineEvents = { type: MachineEventsType };
type MachineContxt = { mode: MachineContextValues };

export const machine = createMachine(
  {
    // to add type-safety to the machine
    tsTypes: {} as import("./machine.typegen").Typegen0,
    schema: {
      context: {} as MachineContxt,
      events: {} as MachineEvents,
    },
    context: {
      mode: "CREATE",
    },
    initial: "idle",
    states: {
      idle: {
        on: {
          CREATE_ECOLOGICAL_ASSET: {
            target: "metadata",
            actions: assign({
              mode: "CREATE",
            }),
          },
          UPDATE_ECOLOGICAL_ASSET: {
            target: "metadata",
            actions: assign({
              mode: "UPDATE",
            }),
          },
          CREATE_WEATHER_STATION: {
            target: "metadataWs",
          },
        },
      },
      metadata: {
        id: "metadata",
        on: {
          SUBMIT_METADATA: "edition",
          CANCEL_METADATA: "idle",
        },
      },
      metadataWs: {
        on: {
          SUBMIT_METADATA_WS: "previewWs",
        },
      },
      edition: {
        initial: "draw",
        entry: ["enterEdition"],
        states: {
          draw: {
            entry: ["enterDraw"],
            exit: ["exitDraw"],
            on: {
              DELETE_FEATURE: "delete",
              MODIFY_FEATURE: "modify",
              CANCEL_EDITION: "#metadata",
              FINISH_EDITION: "#preview",
            },
          },
          modify: {
            entry: ["enterModify"],
            exit: ["exitModify"],
            on: {
              DRAW_FEATURE: "draw",
              DELETE_FEATURE: "delete",
              CANCEL_EDITION: "#metadata",
              FINISH_EDITION: "#preview",
            },
          },
          delete: {
            on: {
              DRAW_FEATURE: "draw",
              MODIFY_FEATURE: "modify",
              FINISH_EDITION: "#preview",
            },
          },
        },
      },
      preview: {
        id: "preview",
        entry: ["enterPreview"],
        on: {
          CANCEL_PREVIEW: "edition.modify",
          MINT_GEONFT: "idle",
        },
      },
      previewWs: {
        on: {
          CANCEL_PREVIEW_WS: "metadataWs",
          MINT_GEONFT: "idle",
        },
      },
    },
    predictableActionArguments: true,
  },
  {
    // Define empty actions is needed to override them in the component
    actions: {
      enterEdition: () => null,
      enterDraw: () => null,
      exitDraw: () => null,
      enterModify: () => null,
      exitModify: () => null,
      enterPreview: () => null,
    },
  }
);
export const machineInterpreter = interpret(machine);
