import { ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, ComponentEmojiResolvable } from "discord.js";
import { CustomDataContext, RunnerComponent, ComponentInteractionType } from "../runnerComponent";
import { WorthlessPromise } from "../../typings/useful";

type ButtonFunction<TCustomData> = (context: CustomDataContext<ButtonInteraction<CacheType>, TCustomData>) => WorthlessPromise;

export interface CreateButtonProps<TCustomData> {
  customData?: TCustomData;
}

export class ButtonComponent<TCustomData> extends RunnerComponent<ComponentInteractionType.Button, TCustomData> {
  style?: ButtonStyle;
  label?: string;
  emoji?: ComponentEmojiResolvable;

  override runner(context: CustomDataContext<ButtonInteraction<CacheType>, TCustomData>): WorthlessPromise {
      return this.runnerFunc(context);
  }

  async create(customData: TCustomData): Promise<ButtonBuilder> {
    const button = new ButtonBuilder()
      .setCustomId(await this.createId(customData))
      .setStyle(this.style ?? ButtonStyle.Primary);
    
    const {label, emoji} = this;
    if (emoji) button.setEmoji(emoji);
    if (label || !emoji) button.setLabel(label ?? "Unknown");

    return button;
  };

  constructor(func: ButtonFunction<TCustomData>, data?: {
    label?: string;
    emoji?: ComponentEmojiResolvable;
    style?: ButtonStyle;
  }) {
    super(ComponentInteractionType.Button, func);

    if (!data) return;
    const {label, style, emoji} = data;

    this.style = style;
    this.label = label;
    this.emoji = emoji;
  }
}

export type AnyButtonComponent = ButtonComponent<any>;