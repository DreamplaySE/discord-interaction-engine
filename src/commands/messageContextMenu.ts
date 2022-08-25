import { MessageContextMenuCommandInteraction } from "discord.js";
import { BaseCommand, CommandType } from "./base";
import { Component } from "../components";
import { Runner } from "../components/runnerComponent";


export class MessageContextMenuCommand extends BaseCommand {
  type: CommandType.MessageContext = CommandType.MessageContext;
  runner: Runner<MessageContextMenuCommandInteraction>;
  
  constructor(runner: Runner<MessageContextMenuCommandInteraction>, associated?: Component[]) {
    super(associated);
    this.runner = runner;
  }
}