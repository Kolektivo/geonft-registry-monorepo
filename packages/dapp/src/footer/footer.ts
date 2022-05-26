import "./footer.scss";

export class Footer {
  footerLinks: HTMLElement;

  showLinks(whichClass: string): void {
    const linksContainer = this.footerLinks.querySelector(`.section .body.${whichClass}`);
    const isShowing = linksContainer.classList.contains("show");
    if (isShowing) {
      linksContainer.classList.remove("show");
    } else {
      linksContainer.classList.add("show");
    }
  }
}
