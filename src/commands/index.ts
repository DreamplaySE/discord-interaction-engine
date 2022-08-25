import { ApplicationCommandOptionType, ApplicationCommandType, AutocompleteInteraction, ChatInputCommandInteraction, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction } from "discord.js";
import { CommandType } from "./base";
import { MessageContextMenuCommand } from "./messageContextMenu";
import { AnyTextCommand, TextCommandGroup, TextCommandOption } from "./textCommand";
import { UserContextMenuCommand } from "./userContextMenu";

export type Command = AnyTextCommand | TextCommandGroup | UserContextMenuCommand | MessageContextMenuCommand;

/**
 * Function handles record interactions by running their respective runner function.
 *
 * @param commands Command container.
 * @param interaction Discord.js command interaction.
 */
export async function commandHandler(commands: Record<string, Command>, interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction) {
  const {commandName} = interaction;

  const command = commands[commandName];
  if (!command) throw new Error("Requested command does not exist!");
  
  switch (interaction.commandType) {
    case ApplicationCommandType.ChatInput: {
      if (!(command.type === CommandType.TextCommand || command.type === CommandType.TextCommandGroup)) throw new Error("Command type does not match!");

      command.runner({interaction});
      break;
    }
    case ApplicationCommandType.User: {    
      if (command.type !== CommandType.UserContext) throw new Error("Command type does not match!");;
      
      command.runner({interaction});

      break;
    }
    case ApplicationCommandType.Message: {
      if (command.type !== CommandType.MessageContext) throw new Error("Command type does not match!");;
      
      command.runner({interaction});

      break;
    }
  }
}

/**
 * Handles auto-complete requests.
 *
 * @param commands Command container.
 * @param interaction Discord.js command interaction.
 */
export async function commandAutocompleteHandler(commands: Record<string, Command>, interaction: AutocompleteInteraction) {
  const {commandName} = interaction;

  const command = commands[commandName];

  const {options: interactionOptions} = interaction;

  let handler: AnyTextCommand;

  if (!command) return;
  switch (command.type) {
    case CommandType.TextCommand: {
      handler = command;

      break;
    }
    case CommandType.TextCommandGroup: {
      const subCommandGroupName = interactionOptions.getSubcommandGroup(false);
      const subCommandName = interactionOptions.getSubcommand(false);

      if (!subCommandName) throw new Error("Sub command name must exist for text command groups!");
      
      handler = command.getCommand(subCommandName, subCommandGroupName ?? undefined);
      
      break;
    }
    default: {
      throw new Error("Command type does not match!");
    }
  }
  
  const {name, value, type} = interaction.options.getFocused(true);

  const option = handler.options?.[name];

  if (!option) throw new Error("Asked autocomplete option does not exist!");

  switch (type) {
    case ApplicationCommandOptionType.Integer:
    case ApplicationCommandOptionType.Number: {
      if (!(option.type === TextCommandOption.Type.Number || option.type === TextCommandOption.Type.Integer)) throw new Error("Autocomplete options type does not match!");
    
      break;
    }
    case ApplicationCommandOptionType.String: {
      if (option.type !== TextCommandOption.Type.String) throw new Error("Autocomplete options type does not match!");

      break;
    }
  }

  if (!option.autoComplete) throw new Error("Option has autocomplete disabled!");
  const result = await option.autoComplete({interaction});

  interaction.respond(result)
}

export {TextCommand, TextCommandGroup, TextCommandOption, TextCommandSubGroup} from "./textCommand";
export type {AnyTextCommand} from "./textCommand"
export {UserContextMenuCommand} from "./userContextMenu";
export {MessageContextMenuCommand} from "./messageContextMenu";
export {BaseCommand, CommandType} from "./base";