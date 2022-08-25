import { AnyButtonComponent } from "./messages/button";
import { AnySelectMenuComponent } from "./messages/selectMenu";
import { AnyModalSubmitComponent } from "./modalSubmit";

/** The fundamental component type which allows you to associate other components.*/
export class BaseComponent {
  associated?: Component[];
}

export type HandledComponent = AnyButtonComponent | AnyModalSubmitComponent | AnySelectMenuComponent;
export type Component = BaseComponent | HandledComponent;

export {ModalSubmitComponent, ModalSubmitOption} from "./modalSubmit";
export type {AnyModalSubmitComponent} from "./modalSubmit";
export * from "./messages";
export * from "./general";
export * from "./customData";