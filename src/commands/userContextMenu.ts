import { UserContextMenuCommandInteraction } from "discord.js";
import { BaseCommand, CommandType } from "./base";
import { Component } from "../components";
import { Runner } from "../components/runnerComponent";

export class UserContextMenuCommand extends BaseCommand {
  type: CommandType.UserContext = CommandType.UserContext;
  runner: Runner<UserContextMenuCommandInteraction>;
  
  constructor(runner: Runner<UserContextMenuCommandInteraction>, associated?: Component[]) {
    super(associated);
    this.runner = runner;
  }
}