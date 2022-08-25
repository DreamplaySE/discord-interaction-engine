import { BaseComponent, Component } from "..";

export class FreeComponent extends BaseComponent {
  constructor(...associated: Component[]) {
    super();

    this.associated = associated;
  }
}