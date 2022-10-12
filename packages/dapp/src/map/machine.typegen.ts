// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "xstate.init": { type: "xstate.init" };
    "xstate.stop": { type: "xstate.stop" };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingActions: {
    enterDraw: "START_DRAWING" | "SUBMIT_METADATA";
    enterEdition: "SUBMIT_METADATA";
    enterModify: "MODIFY_MODE";
    exitDraw: "MODIFY_MODE" | "xstate.stop";
    exitModify:
      | "CANCEL_EDITION"
      | "DELETE_FEATURE"
      | "START_DRAWING"
      | "xstate.stop";
  };
  eventsCausingServices: {};
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates:
    | "edition"
    | "edition.delete"
    | "edition.draw"
    | "edition.modify"
    | "idle"
    | "metadata"
    | "preview"
    | { edition?: "delete" | "draw" | "modify" };
  tags: never;
}
