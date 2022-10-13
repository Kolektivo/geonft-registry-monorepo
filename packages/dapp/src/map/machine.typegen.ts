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
    enterDraw: "CANCEL_PREVIEW" | "DRAW_FEATURE" | "SUBMIT_METADATA";
    enterEdition: "CANCEL_PREVIEW" | "SUBMIT_METADATA";
    enterModify: "CANCEL_PREVIEW" | "MODIFY_FEATURE";
    enterPreview: "FINISH_EDITION";
    exitDraw:
      | "CANCEL_EDITION"
      | "DELETE_FEATURE"
      | "FINISH_EDITION"
      | "MODIFY_FEATURE"
      | "xstate.stop";
    exitModify:
      | "CANCEL_EDITION"
      | "DELETE_FEATURE"
      | "DRAW_FEATURE"
      | "FINISH_EDITION"
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
