import { BaseInteraction, ButtonInteraction, ModalSubmitInteraction, SelectMenuInteraction } from "discord.js";
import { BaseComponent } from ".";
import { InteractionEngine } from "../engine";
import { TypedTypeMap } from "../typings/options";
import { WorthlessPromise } from "../typings/useful";

export interface InteractionContext<T extends BaseInteraction> {
  interaction: T;
}

export interface CustomDataContext<T extends BaseInteraction, TCustomData> extends InteractionContext<T> {
  customData: TCustomData;
}

export type Runner<T extends BaseInteraction, U extends InteractionContext<T> = InteractionContext<T>> = (context: U) => WorthlessPromise;

export type ComponentRunnerInteractionType = ComponentInteractionType.ModalSubmit | ComponentInteractionType.Button | ComponentInteractionType.SelectMenu;

export enum ComponentInteractionType {
  Button,
  SelectMenu,
  ModalSubmit,
}

interface RunnerInteractionMap extends TypedTypeMap<ComponentRunnerInteractionType, BaseInteraction> {
  [ComponentInteractionType.Button]: ButtonInteraction;
  [ComponentInteractionType.SelectMenu]: SelectMenuInteraction;
  [ComponentInteractionType.ModalSubmit]: ModalSubmitInteraction;
}

/** The fundamental component that all  */
export class RunnerComponent<TInteractionType extends ComponentRunnerInteractionType, TCustomData = never, TContext extends CustomDataContext<RunnerInteractionMap[TInteractionType], TCustomData> = CustomDataContext<RunnerInteractionMap[TInteractionType], TCustomData>> extends BaseComponent {
  registeredId?: string;
  private interactionEngine?: InteractionEngine;

  get id(): string {
    if (!this.registeredId) throw new Error("Id gotten before registration.");
    return this.registeredId;
  }

  createId(customData: TCustomData): Promise<string> {
    if (!this.interactionEngine) throw new Error("Id created before registration.");
    return this.interactionEngine.createCustomId(this.id, customData);
  }

  register(registeredId: string, engine: InteractionEngine) {
    this.registeredId = registeredId;
    this.interactionEngine = engine;
  }
  
  readonly type: TInteractionType;
  
  /** The provided runner function that gets run inside the runner function. */
  protected runnerFunc: (context: TContext) => WorthlessPromise;

  /**
   * This function runs the components handler that takes care of sent interactions of its type.
   *
   * @param context The context to run the component with.
   */
  async runner(context: CustomDataContext<RunnerInteractionMap[TInteractionType], TCustomData>): Promise<unknown | void> {
    throw new Error("Not implemented for child component.");
  };

  constructor(type: TInteractionType, runnerFunc: (context: TContext) => WorthlessPromise) {
    super();
    this.type = type;

    this.runnerFunc = runnerFunc;
  }
}