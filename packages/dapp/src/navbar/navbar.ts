import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import "./navbar.scss";

@autoinject
export class Navbar {
  menuOpen = false;

  constructor(private router: Router) {}

  private toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  private goto(url: string): void {
    this.menuOpen = false;
  }

  private navigate(href: string): void {
    this.menuOpen = false;
    this.router.navigate(href);
  }
}
