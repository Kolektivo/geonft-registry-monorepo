import { createMachine, interpret } from "xstate";

export type MachineEventsType =
  | "CREATE_FOODFOREST"
  | "CANCEL_METADATA"
  | "SUBMIT_METADATA"
  | "EDIT_MODE"
  | "START_DRAWING"
  | "DELETE_FEATURE"
  | "EDIT_FEATURES"
  | "CANCEL_EDITION";

type MachineEvents = { type: MachineEventsType };

export const machine = createMachine(
  {
    tsTypes: {} as import("./machine.typegen").Typegen0,
    schema: {
      context: {} as { value: string },
      events: {} as MachineEvents,
    },
    initial: "idle",
    predictableActionArguments: true,
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
        states: {
          draw: {
            on: {
              EDIT_MODE: "modify",
            },
          },
          modify: {
            entry: ["enterModify"],
            exit: ["exitModify"],
            on: {
              START_DRAWING: "draw",
              DELETE_FEATURE: "delete",
              CANCEL_EDITION: "#metadata",
            },
          },
          delete: {
            on: {
              EDIT_MODE: "modify",
            },
          },
        },
      },
      preview: {},
    },
  },
  {
    actions: {
      enterModify: () => null,
      exitModify: () => null,
    },
  }
);
export const machineInterpreter = interpret(machine);
