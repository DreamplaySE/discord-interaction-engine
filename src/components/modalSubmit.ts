import { ActionRowBuilder, ModalBuilder, ModalSubmitFields, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import { CustomDataContext, RunnerComponent, ComponentInteractionType } from "./runnerComponent";
import { OptionalOption, Options as BaseOptions, Transform as BaseTransform, TypedTypeMap } from "../typings/options";
import { WorthlessPromise } from "../typings/useful";

export namespace ModalSubmitOption {
  export enum Type {
    Text = "text",
    Date = "date",
  }
  
  export interface BaseOption extends OptionalOption<Type> {
    label: string;
  }
  
  interface TypeMap extends TypedTypeMap<Type> {
    [Type.Text]: string;
    [Type.Date]: Date | null;
  }

  export interface TextOption extends BaseOption {
    type: Type.Text;
    style?: TextInputStyle;
    min?: number;
    max?: number;
    placeholder?: string;
  }

  export interface DateOption extends BaseOption {
    type: Type.Date;
    time?: boolean;
  }
  
  export type All = TextOption | DateOption;
  
  export type Options = BaseOptions<string, All>;
  export type Transform<T extends Options = Options> = BaseTransform<BaseOption, TypeMap, Type, T>;
  
  /**
   * Parses command parameter fields.
   *
   * @param fields The fields to get data from.
   * @param optionsConfig The config to use for gathering data.
   * @returns Returns the parsed data.
   */
  export function parse<T extends Options, TTransform extends Transform<T>>(fields: ModalSubmitFields, optionsConfig: T): TTransform {
    const result: Transform = {};
  
    for (const [name, option] of Object.entries(optionsConfig)) {
      const {type} = option;
      
      switch (type) {
      case Type.Text: {
        const value = fields.getTextInputValue(name);
        result[name] = value;
          
        break;
      }
      case Type.Date: {
        const value = fields.getTextInputValue(name);

        if (value === "") {
          if (option.required) {
            throw new Error("Required is empty!");
          }

          result[name] = undefined;

          break;
        }

        const dateMilliseconds = Date.parse(value);

        result[name] = isNaN(dateMilliseconds) ? null : new Date(dateMilliseconds);
          
        break;
      }
      }
    }
  
    return result as TTransform;
  }
}


interface ModalSubmitContext<
  TCustomData,
  TTransform
> extends CustomDataContext<ModalSubmitInteraction, TCustomData> {
  options: TTransform;
}

type ModalSubmitFunction<
  TCustomData,
  TTransform extends ModalSubmitOption.Transform
> = (context: ModalSubmitContext<TCustomData, TTransform>) => WorthlessPromise;

const DATE_PLACEHOLDER = "YYYY-MM-DD";
const DATE_TIME_PLACEHOLDER = `${DATE_PLACEHOLDER} HH:SS`;

export class ModalSubmitComponent<
  TCustomData,
  TOptions extends ModalSubmitOption.Options,
  TTransform extends ModalSubmitOption.Transform<TOptions>,
> extends RunnerComponent<
  ComponentInteractionType.ModalSubmit,
  TCustomData,
  ModalSubmitContext<TCustomData, TTransform>
> {
  private title: string;
  readonly options: TOptions;

  override runner(context: CustomDataContext<ModalSubmitInteraction, TCustomData>): WorthlessPromise {
    const options = ModalSubmitOption.parse<TOptions, TTransform>(context.interaction.fields, this.options ?? {});
    
    const modalSubmitContext: ModalSubmitContext<TCustomData, TTransform> = {
      ...context,
      options,
    };

    return this.runnerFunc(modalSubmitContext);
  }

  async create(customData: TCustomData, placeholders?: Partial<TTransform>): Promise<ModalBuilder> {
    const modal = new ModalBuilder()
      .setCustomId(await this.createId(customData))
      .setTitle(this.title);
    
    const {options} = this;

    if (options) {
      for (const [key, option] of Object.entries(options)) {
        const placeHolder = placeholders?.[key] as any | undefined;
        switch (option.type) {
        case ModalSubmitOption.Type.Text: {
          const {label, max, min, placeholder, required, style} = option;

          const textInput = new TextInputBuilder()
            .setCustomId(key)
            .setLabel(label)
            .setStyle(style ?? TextInputStyle.Short)
            .setRequired(required ?? false);
            
          if (max) textInput.setMaxLength(max);
          if (min) textInput.setMinLength(min);
          if (placeholder || placeHolder !== undefined) textInput.setPlaceholder(placeHolder ?? placeholder);
            
          const row = new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);

          modal.addComponents(row);

          break;
        }
        case ModalSubmitOption.Type.Date: {
          const {label, required, time} = option;

          const textInput = new TextInputBuilder()
            .setCustomId(key)
            .setLabel(label)
            .setStyle(TextInputStyle.Short)
            .setRequired(required ?? false)
            .setPlaceholder(time ? DATE_TIME_PLACEHOLDER : DATE_PLACEHOLDER);
            
          const row = new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);

          modal.addComponents(row);
            
          break;
        }
        }
      }
    }

    return modal;

  }

  static FromOptions<TOptions extends ModalSubmitOption.Options>(data: {
    title: string;
    options: TOptions;
  }): 
    <TCustomData>(func: ModalSubmitFunction<TCustomData, ModalSubmitOption.Transform<TOptions>>)
      => ModalSubmitComponent<TCustomData, TOptions, ModalSubmitOption.Transform<TOptions>>
  {
    return (func) => new ModalSubmitComponent(func, data);
  }

  constructor(func: ModalSubmitFunction<TCustomData, TTransform>, {title, options}: {
    title: string;
    options: TOptions;
  }) {
    super(ComponentInteractionType.ModalSubmit, func);
    this.title = title;
    this.options = options;
  }
}

export type AnyModalSubmitComponent = ModalSubmitComponent<any, Record<string, ModalSubmitOption.All>, any>;
