import { CacheType, ComponentEmojiResolvable, SelectMenuBuilder, SelectMenuInteraction } from "discord.js";
import { CustomDataContext, RunnerComponent, ComponentInteractionType } from "../runnerComponent";
import { WorthlessPromise } from "../../typings/useful";

export interface SelectMenuOption {
  default?: boolean;
  description?: string;
  emoji?: ComponentEmojiResolvable;
  label: string;
}

export interface SelectMenuOptions {
  readonly [key: string]: SelectMenuOption,
}

type SelectedMenuOptions<TSelectMenuOptions extends SelectMenuOptions> = {
  [P in keyof TSelectMenuOptions]?: true;
}

export interface SelectMenuContext<TSelectMenuOptions extends SelectMenuOptions, TCustomData> extends CustomDataContext<SelectMenuInteraction, TCustomData> {
  optionValues: (keyof TSelectMenuOptions)[];
  options: SelectedMenuOptions<TSelectMenuOptions>;
}

type SelectMenuFunction<TSelectMenuOptions extends SelectMenuOptions, TCustomData> = (context: SelectMenuContext<TSelectMenuOptions, TCustomData>) => WorthlessPromise;

export class SelectMenuComponent<TSelectMenuOptions extends SelectMenuOptions, TCustomData> extends RunnerComponent<ComponentInteractionType.SelectMenu, TCustomData, SelectMenuContext<TSelectMenuOptions, TCustomData>> {
  options: TSelectMenuOptions;
  private max?: number;
  private min?: number;

  async create(customData: TCustomData, disabled?: boolean): Promise<SelectMenuBuilder> {
    const {options, min, max} = this;

    const button = new SelectMenuBuilder()
      .setCustomId(await this.createId(customData))
      .addOptions(Object.entries(options).map(([value, option]) => ({
        ...option,
        value,
      })));

    if (disabled) button.setDisabled(true);

    if (min) button.setMinValues(min);
    if (max) button.setMaxValues(max);

    return button;
  }

  override runner(context: CustomDataContext<SelectMenuInteraction<CacheType>, TCustomData>): WorthlessPromise {
      

    const optionValues = context.interaction.values as (keyof TSelectMenuOptions)[];
    const options: SelectedMenuOptions<TSelectMenuOptions> = {};

    for (const optionValue of optionValues) {
      options[optionValue] = true;
    }

    return this.runnerFunc({...context, options, optionValues});
  }

  constructor(func: SelectMenuFunction<TSelectMenuOptions, TCustomData>, {min, max, options}: {
    min?: number;
    max?: number;
    options: TSelectMenuOptions;
  }) {
    super(ComponentInteractionType.SelectMenu, func);

    this.min = min;
    this.max = max;
    this.options = options;
  }
}

export type AnySelectMenuComponent = SelectMenuComponent<Record<string, SelectMenuOption>, any>;