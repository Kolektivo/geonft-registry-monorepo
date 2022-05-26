import { autoinject } from "aurelia-framework";
import { Router, RouterConfiguration, NavigationInstruction, Next } from "aurelia-router";
import { PLATFORM } from "aurelia-pal";

@autoinject
export class App {
  router: Router;

  private configureRouter(config: RouterConfiguration, router: Router) {

    config.title = "Astral Kolektivo";

    config.map([
      {
        moduleId: PLATFORM.moduleName("./home/home"),
        nav: true,
        name: "home",
        route: ["", "/", "home"],
        title: "Home",
      },
      {
        moduleId: PLATFORM.moduleName("./map/map-component"),
        nav: false,
        name: "map",
        route: ["map"],
        title: "Map",
      }
    ]);

    config.fallbackRoute("home");

    this.router = router;
  }
}
