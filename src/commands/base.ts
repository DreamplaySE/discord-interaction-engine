import { Component } from "../components";

export class BaseCommand {
  associated?: Component[];

  constructor(associated?: Component[]) {
    this.associated = associated;
  }
}

export enum CommandType {
  TextCommand,
  TextCommandSubGroup,
  TextCommandGroup,
  MessageContext,
  UserContext,
}