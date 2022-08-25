/* eslint-disable @typescript-eslint/no-empty-function */
import { SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { TextCommand, TextCommandOption } from "../commands";
import {commandToJson} from "../commands/jsonHandling";

test("Blank text command JSON is correct", () => {
  const name = "command";
  const description = "This is a description.";
  const command = new TextCommand({
    description,
    runner: async () => {},
  });

  const commandJson = commandToJson(name, command);

  const correctCommandJson = new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .toJSON();

  expect(commandJson).toStrictEqual(correctCommandJson);
});

test("Text command JSON is correct with string option type", () => {
  const name = "command";
  const optionName = "option_name";
  const description = "This is a description.";
  const command = new TextCommand({
    description,
    runner: async () => {},
    options: {
      [optionName]: {
        description,
        type: TextCommandOption.Type.String,
      }
    },
  });

  const commandJson = commandToJson(name, command);

  const correctCommandJsonBuilder = new SlashCommandBuilder()
    .setName(name)
    .setDescription(description);


  const optionBuilder = new SlashCommandStringOption()
    .setName(optionName)
    .setDescription(description);

  correctCommandJsonBuilder.addStringOption(optionBuilder);

  const correctCommandJson = correctCommandJsonBuilder.toJSON();

  expect(commandJson).toStrictEqual(correctCommandJson);
});