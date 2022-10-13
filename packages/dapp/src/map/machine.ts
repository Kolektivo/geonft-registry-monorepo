import { createMachine, interpret } from "xstate";

export type MachineEventsType =
  | "CREATE_FOODFOREST"
  | "CANCEL_METADATA"
  | "SUBMIT_METADATA"
  | "MODIFY_MODE"
  | "START_DRAWING"
  | "DELETE_FEATURE"
  | "EDIT_FEATURES"
  | "CANCEL_EDITION"
  | "FINISH_EDITION"
  | "CANCEL_PREVIEW"
  | "MINT_GEONFT";

type MachineEvents = { type: MachineEventsType };

export const machine = createMachine(
  {
    tsTypes: {} as import("./machine.typegen").Typegen0,
    schema: {
      context: {} as { value: string },
      events: {} as MachineEvents,
    },
    initial: "idle",
    states: {
      idle: {
        on: {
          CREATE_FOODFOREST: "metadata",
        },
      },
      metadata: {
        id: "metadata",
        on: {
          SUBMIT_METADATA: "edition",
          CANCEL_METADATA: "idle",
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
              MODIFY_MODE: "modify",
              FINISH_EDITION: "#preview",
            },
          },
          modify: {
            entry: ["enterModify"],
            exit: ["exitModify"],
            on: {
              START_DRAWING: "draw",
              DELETE_FEATURE: "delete",
              CANCEL_EDITION: "#metadata",
              FINISH_EDITION: "#preview",
            },
          },
          delete: {
            on: {
              MODIFY_MODE: "modify",
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
    },
    predictableActionArguments: true,
  },
  {
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
