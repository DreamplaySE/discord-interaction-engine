import { REST } from "@discordjs/rest";
import { RESTPostAPIApplicationCommandsJSONBody, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, ContextMenuCommandBuilder, ApplicationCommandType, SlashCommandStringOption, SlashCommandNumberOption, SlashCommandIntegerOption, SlashCommandBooleanOption, SlashCommandChannelOption, SlashCommandUserOption, SlashCommandRoleOption, SlashCommandMentionableOption, SlashCommandAttachmentOption, APIApplicationCommandOptionChoice, Routes } from "discord.js";
import { AnyTextCommand, Command, TextCommandOption } from ".";
import { CommandType } from "./base";
import { Choices, TextCommandGroupType } from "./textCommand";

type DiscordOptionTypes =
  SlashCommandStringOption  | SlashCommandNumberOption      | SlashCommandBooleanOption   |
  SlashCommandIntegerOption | SlashCommandChannelOption     | SlashCommandUserOption      |
  SlashCommandRoleOption    | SlashCommandMentionableOption | SlashCommandAttachmentOption;

const setSharedDetails = ({name, description, required}: {
  name: string;
  description: string;
  required?: boolean;
}) => (option: DiscordOptionTypes) => {
  option.setName(name);
  option.setDescription(description);
  option.setRequired(required ?? false);
};

const choicesToApiChoices = <T extends number | string>(choices: Choices<T>): APIApplicationCommandOptionChoice<T>[] => {
  return Object
    .entries(choices)
    .map(([name, value]) => ({
      name,
      value,
    }))
};

const setDetails = (
  name: string,
  {description}: AnyTextCommand | TextCommandGroupType,
  builder: SlashCommandBuilder | SlashCommandSubcommandBuilder | SlashCommandSubcommandGroupBuilder
) => {
  builder.setName(name);
  builder.setDescription(description);
};

/**
 * Registers commands to the API.
 *
 * @param data API registry data.
 * @param data.botToken The token to use for registering command data.
 * @param data.clientId The client id to use for registering the commands.
 * @param data.guildId The guild to register the commands in.
 * @param commands Command container.
 */
export async function registerToAPI(data: {
  botToken: string;
  clientId: string;
  guildId: string;
}, commands: Record<string, Command>) {
  const rest = new REST({ version: "9" }).setToken(data.botToken);

  const commandsJSON: RESTPostAPIApplicationCommandsJSONBody[] = Object.entries(commands)
    .map(([key, command]) => commandToJson(key, command));

  if (commandsJSON.length > 0)
    rest.put(Routes.applicationGuildCommands(data.clientId, data.guildId), { body: commandsJSON })
      .then(() => console.log(`Registered ${commandsJSON.length} slash commands to the API.`))
      .catch((error) => console.error("Failed to register slash commands to the API.", error));
}

/**
 *
 * @param name The name of the command.
 * @param command The command to register.
 * @param builder The builder to add command details to.
 */
function loadCommandJSON (
  name: string,
  command: AnyTextCommand,
  builder: SlashCommandBuilder | SlashCommandSubcommandBuilder,
) {
  setDetails(name, command, builder);
  addOptions(command.options, builder);  
}

/**
 *
 * @param key The name of the command.
 * @param command The command to register.
 * @returns REST API command JSON.
 */
export function commandToJson(key: string, command: Command): RESTPostAPIApplicationCommandsJSONBody {
  switch (command.type) {
    case CommandType.TextCommand: {
      const builder = new SlashCommandBuilder();
      loadCommandJSON(key, command, builder);
      
      return builder.toJSON();
    };
    case CommandType.TextCommandGroup: {
      const builder = new SlashCommandBuilder();
      setDetails(key, command, builder);
      
      for (const [subKey, subCommand] of Object.entries(command.commands)) {
        switch (subCommand.type) {
          case CommandType.TextCommand: {
            const subCommandBuilder = new SlashCommandSubcommandBuilder();
            loadCommandJSON(subKey, subCommand, subCommandBuilder);
            builder.addSubcommand(subCommandBuilder);

            break;
          }
          case CommandType.TextCommandSubGroup: {
            const subCommandGroupBuilder = new SlashCommandSubcommandGroupBuilder();
            setDetails(subKey, subCommand, subCommandGroupBuilder);

            for (const [subSubKey, subSubCommand] of Object.entries(subCommand.commands)) {                  
              const subCommandBuilder = new SlashCommandSubcommandBuilder();
              loadCommandJSON(subSubKey, subSubCommand, subCommandBuilder);
              subCommandGroupBuilder.addSubcommand(subCommandBuilder);
            }

            builder.addSubcommandGroup(subCommandGroupBuilder);

            break;
          }
        }
      }
      
      return builder.toJSON();
    };
    case CommandType.UserContext: {
      const builder = new ContextMenuCommandBuilder()
        .setName(key)
        .setType(ApplicationCommandType.User);
      
      return builder.toJSON();
    };
    case CommandType.MessageContext: {
      const builder = new ContextMenuCommandBuilder()
        .setName(key)
        .setType(ApplicationCommandType.Message);
      
      return builder.toJSON();
    };
  }
}

/**
 * Adds command options to builder.
 *
 * @param options The command options you want to add to the builder.
 * @param builder The JSON builder you want to add options to.
 */
export function addOptions(options: Record<string, TextCommandOption.All> | undefined, builder: SlashCommandBuilder | SlashCommandSubcommandBuilder) {
  
  if (!options) return;
  const sortingOptions = Object.entries(options).map(([name, value]) => ({...value, name}));
  sortingOptions.sort((a, b) => (+Boolean(b.required)) - (+Boolean(a.required)));

  for (const option of sortingOptions) {
    const setDetails = setSharedDetails(option);
    const {type} = option;

    switch (type) {
      case TextCommandOption.Type.String: {
        const optionBuilder = new SlashCommandStringOption();
        setDetails(optionBuilder);
        const {autoComplete, choices} = option;
        if (autoComplete) optionBuilder.setAutocomplete(true);
        if (choices) {
          const apiChoices = choicesToApiChoices<string>(choices);

          optionBuilder.setChoices(...apiChoices);
        }

        builder.addStringOption(optionBuilder);
        break;
      }
      case TextCommandOption.Type.Number:
      case TextCommandOption.Type.Integer: {
        const optionBuilder = type === TextCommandOption.Type.Number ? new SlashCommandNumberOption() : new SlashCommandIntegerOption();
        setDetails(optionBuilder);
        const {min, max, autoComplete, choices} = option;
        if (min) optionBuilder.setMinValue(min);
        if (max) optionBuilder.setMaxValue(max);
        if (autoComplete) optionBuilder.setAutocomplete(true);
        if (choices) {
          const apiChoices = choicesToApiChoices<number>(choices);

          optionBuilder.setChoices(...apiChoices);
        }

        if (type === TextCommandOption.Type.Number) builder.addNumberOption(optionBuilder as SlashCommandNumberOption);
        else builder.addIntegerOption(optionBuilder as SlashCommandIntegerOption);
        break;
      }
      case TextCommandOption.Type.Boolean: {
        const optionBuilder = new SlashCommandBooleanOption();
        setDetails(optionBuilder);
        
        builder.addBooleanOption(optionBuilder);
        break;
      }
      case TextCommandOption.Type.Channel: {
        const optionBuilder = new SlashCommandChannelOption();
        setDetails(optionBuilder);
        const {channelTypes} = option;
        if (channelTypes) optionBuilder.addChannelTypes(...channelTypes);
        
        builder.addChannelOption(optionBuilder);
        break;
      }
      case TextCommandOption.Type.User: {
        const optionBuilder = new SlashCommandUserOption();
        setDetails(optionBuilder);
        
        builder.addUserOption(optionBuilder);
        break;
      }
      case TextCommandOption.Type.Role: {
        const optionBuilder = new SlashCommandRoleOption();
        setDetails(optionBuilder);
        
        builder.addRoleOption(optionBuilder);
        break;
      }
      case TextCommandOption.Type.Mentionable: {
        const optionBuilder = new SlashCommandMentionableOption();
        setDetails(optionBuilder);
        
        builder.addMentionableOption(optionBuilder);
        break;
      }
      case TextCommandOption.Type.Attachment: {
        const optionBuilder = new SlashCommandAttachmentOption();
        setDetails(optionBuilder);
        
        builder.addAttachmentOption(optionBuilder);
        break;
      }
    }
  }
};