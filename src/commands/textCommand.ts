import { Attachment, AutocompleteInteraction, ChannelType, ChatInputCommandInteraction, CommandInteraction } from "discord.js";
import { OptionalOption, Options as BaseOptions, Transform as BaseTransform, TypedTypeMap } from "../typings/options";
import { APIInteractionDataResolvedChannel, APIInteractionDataResolvedGuildMember, APIRole } from "discord.js";
import { GuildBasedChannel, GuildMember, User, Role } from "discord.js";
import { BaseCommand, CommandType } from "./base";
import { Component } from "../components";
import { InteractionContext, Runner } from "../components/runnerComponent";

export type Choices<T> = {
  [key: string]: T;
};

export namespace TextCommandOption {
  export enum Type {
    String = "string",
    Integer = "integer",
    Number = "number",
    Boolean = "boolean",
    Channel = "channel",
    Member = "member",
    User = "user",
    Role = "role",
    Mentionable = "mentionable",
    Attachment = "attachment",
  }

  export interface TypeMap extends TypedTypeMap<Type> {
    [Type.String]: string;
    [Type.Number]: number;
    [Type.Integer]: number;
    [Type.Boolean]: boolean;
    [Type.Channel]: APIInteractionDataResolvedChannel | GuildBasedChannel;
    [Type.Member]: GuildMember | APIInteractionDataResolvedGuildMember;
    [Type.User]: User;
    [Type.Role]: Role | APIRole;
    [Type.Mentionable]:
      TypeMap[Type.Member] |
      TypeMap[Type.User] |
      TypeMap[Type.Role];
    [Type.Attachment]: Attachment;
  }

  export interface BaseOption extends OptionalOption<Type> {
    description: string;
  }

  interface AutoCompleteData<T extends string | number> {
    name: string;
    value: T;
  }

  interface AutoCompleteContext extends InteractionContext<AutocompleteInteraction> {
  }

  export interface StringOption extends BaseOption {
    type: Type.String;
    autoComplete?: (context: AutoCompleteContext) => Promise<AutoCompleteData<string>[]>;
    choices?: Choices<string>;
  }
  
  export interface NumberOption extends BaseOption {
    type: Type.Integer | Type.Number;
    min?: number;
    max?: number;
    autoComplete?: (interaction: AutoCompleteContext) => Promise<AutoCompleteData<number>[]>;
    choices?: Choices<number>;
  }
  
  export interface BooleanOption extends BaseOption {
    type: Type.Boolean;
  }
  
  type ChannelTypes = ChannelType.GuildText | ChannelType.GuildVoice | ChannelType.GuildCategory | ChannelType.GuildNews | ChannelType.GuildNewsThread | ChannelType.GuildPublicThread | ChannelType.GuildPrivateThread | ChannelType.GuildStageVoice;
  
  export interface ChannelOption extends BaseOption {
    type: Type.Channel;
    channelTypes?: ChannelTypes[];
  }
  
  export interface UserOption extends BaseOption {
    type: Type.User;
  }
  
  export interface RoleOption extends BaseOption {
    type: Type.Role;
  }
  
  export interface MentionableOption extends BaseOption {
    type: Type.Mentionable;
  }
  
  export interface AttachmentOption extends BaseOption {
    type: Type.Attachment;
  }
  
  export type All = StringOption | NumberOption | BooleanOption | ChannelOption | UserOption | RoleOption | MentionableOption | AttachmentOption;

  export type Options = BaseOptions<Type, All>;
  export type Transform<T extends Options = Options> = BaseTransform<All, TypeMap, Type, T>;

  export const parse = <TOptions extends Options, TTransform extends Transform<TOptions>>({options}: ChatInputCommandInteraction, optionsConfig?: TOptions): TTransform => {
    const result: Transform = {};

    if (!optionsConfig) return {} as TTransform;
  
    for (const [name, option] of Object.entries(optionsConfig)) {
      const {type, required} = option;
      
      switch (type) {
        case Type.Boolean: {
          const value = options.get(name)?.value;
          if (value !== null) result[name] = value;
          
          break;
        }
        case Type.Integer: {
          const value = options.get(name)?.value;
          if (value !== null) result[name] = value;
          
          break;
        }
        case Type.Number: {
          const value = options.get(name)?.value;
          if (value !== null) result[name] = value;
          
          break;
        }
        case Type.String: {
          const value = options.get(name)?.value;
          if (value !== null) result[name] = value;
          
          break;
        }
        case Type.User: {
          const value = options.get(name)?.user;
          if (value !== null) result[name] = value;
          
          break;
        }
        case Type.Role: {
          const value = options.get(name)?.role;
          if (value !== null) result[name] = value;
          
          break;
        }
        case Type.Channel: {
          const value = options.get(name)?.channel;
          if (value !== null) result[name] = value;
          
          break;
        }
        case Type.Mentionable: {
          const fullValue = options.get(name);
          const value = fullValue?.member ?? fullValue?.user ?? fullValue?.role;
          if (value !== null) result[name] = value;
          
          break;
        }
        case Type.Attachment: {
          const value = options.get(name)?.attachment;
          if (value !== undefined) result[name] = value;
          
          break;
        }
      }

      if (required && (result[name] === undefined)) throw new Error("Required option does not exist on interaction!");
    }
  
    return result as TTransform;
  };
}

type CommandContext<T extends TextCommandOption.Transform> = InteractionContext<CommandInteraction> & {
  options: T;
}


export class TextCommand<TOptions extends TextCommandOption.Options = {}, TTransform extends TextCommandOption.Transform<TOptions> = TextCommandOption.Transform<TOptions>> extends BaseCommand {
  type: CommandType.TextCommand = CommandType.TextCommand;

  runnerFunc: Runner<CommandInteraction, CommandContext<TTransform>>;
  description: string;
  readonly options?: TOptions;

  async runner(context: InteractionContext<ChatInputCommandInteraction>) {
    const options = TextCommandOption.parse<TOptions, TTransform>(context.interaction, this.options);

    this.runnerFunc({...context, options});
  }

  constructor({runner, description, options}: {
    runner: Runner<CommandInteraction, CommandContext<TTransform>>;
    description: string;
    readonly options?: TOptions;
  }, associated?: Component[]) {
    super(associated);

    this.runnerFunc = runner;
    this.description = description;
    this.options = options;
  }
}

export type AnyTextCommand = TextCommand<Record<string, TextCommandOption.All>, any>;

export class TextCommandGroupType extends BaseCommand {
  description: string;

  constructor(description: string, associated?: Component[]) {
    super(associated);

    this.description = description;
  }
}

export class TextCommandGroup extends TextCommandGroupType {
  type: CommandType.TextCommandGroup = CommandType.TextCommandGroup;

  commands: Record<string, TextCommandSubGroup | AnyTextCommand>;

  getCommand(subCommandName: string, subCommandGroupName?: string) {
    if (subCommandGroupName) {
      const subCommandGroup = this.commands[subCommandGroupName];

      if (!subCommandGroup) throw new Error("Sub command group doesn't exist!");
      if (subCommandGroup.type !== CommandType.TextCommandSubGroup) throw new Error("Sub command group is of wrong type!");
      
      return subCommandGroup.getCommand(subCommandName);
    }
    
    const subCommand = this.commands[subCommandName];

    if (subCommand.type !== CommandType.TextCommand) throw new Error("Sub command is of wrong type!");
    if (!subCommand) throw new Error("Sub command doesn't exist!");

    return subCommand;
  }

  async runner(context: InteractionContext<ChatInputCommandInteraction>) {
    const {options} = context.interaction;
    const subCommandGroupName = options.getSubcommandGroup(false);
    const subCommandName = options.getSubcommand(false);

    if (!subCommandName) throw new Error("Sub command name must exist for text command groups!");
    
    const handler = this.getCommand(subCommandName, subCommandGroupName ?? undefined);
    
    await handler.runner(context);
  }

  constructor({commands, description}: {
    commands: Record<string, TextCommandSubGroup | AnyTextCommand>;
    description: string;
  }, associated?: Component[]) {
    super(description, associated);

    this.commands = commands;
  }
}

export class TextCommandSubGroup extends TextCommandGroupType {
  type: CommandType.TextCommandSubGroup = CommandType.TextCommandSubGroup;

  commands: Record<string, AnyTextCommand>;

  getCommand(subCommandName: string) {
    const subSubCommand = this.commands[subCommandName];

    if (!subSubCommand) throw new Error("Sub command doesn't exist!");

    return subSubCommand;
  }

  constructor({commands, description}: {
    commands: Record<string, AnyTextCommand>;
    description: string;
  }, associated?: Component[]) {
    super(description, associated);

    this.commands = commands;
  }
}