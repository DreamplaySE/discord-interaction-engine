import { Client, ComponentType, Interaction, InteractionType } from "discord.js";
import { Component, HandledComponent, CustomDataHandler, KeyValueStoreStrategy, encode, parse } from "./components";
import { Command, commandAutocompleteHandler, commandHandler, CommandType } from "./commands";
import Keyv from "keyv";
import { AnyHook, HookContainer } from "./hooks";
import { ComponentInteractionType, RunnerComponent } from "./components/runnerComponent";

export interface InteractionEngineProps {
  commands?: Record<string, Command>;
  components?: Component[];
  customDataHandler?: CustomDataHandler;
  hooks?: AnyHook[];
}
export class InteractionEngine {
  client: Client;
  commands: Record<string, Command> = {};
  components: Record<string, HandledComponent> = {};
  hooks: HookContainer = {};
  total = 0;
  private customDataHandler: CustomDataHandler = {
    strategy: KeyValueStoreStrategy.Full,
    store: new Keyv(),
  };

  constructor(client: Client, {commands, components, customDataHandler, hooks}: InteractionEngineProps = {}) {
    this.client = client;
    if (customDataHandler) this.customDataHandler = customDataHandler;

    components = components = [];

    if (commands) {
      this.commands = commands;

      const commandComponents = Object.values(commands).map(command => {
        const associations = command.associated ?? [];
  
        if (command.type !== CommandType.TextCommandGroup) {
          return associations;
        }
  
        const subAssociation = Object.values(command.commands).map(subCommand => {
          const subAssociations = subCommand.associated ?? [];
  
          if (subCommand.type !== CommandType.TextCommandSubGroup) {
            return subAssociations;
          }
  
          const subSubAssociations = Object.values(subCommand.commands)
            .map(subSubCommand => (subSubCommand.associated ?? []));
  
          return subAssociations.concat(...subSubAssociations);
        });
  
        return associations.concat(...subAssociation);
      });
      
      components = components.concat(...commandComponents);
    }

    if (hooks) {
      for (const hook of hooks) {
        this.hooks[hook.type] ??= [];
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.hooks[hook.type]!.push(hook as any);
      }

      const hookComponents = Object.values(hooks).map(hook => {
        const associations = hook.associated ?? [];
  
        return associations;
      });
      
      components = components.concat(...hookComponents);
    }

    components.forEach(component => this.loadComponent(component));
  }

  async createCustomId<T>(id: string, value?: T): Promise<string> {
    return await encode(id, value, this.customDataHandler);
  }

  loadComponent(component: Component) {
    if (component instanceof RunnerComponent) {
      const key = this.total.toString();
      component.register(key, this);
      this.components[key] = component;
      this.total += 1;
    }

    component.associated?.forEach(component => this.loadComponent(component));
  }

  async handler(interaction: Interaction): Promise<void> {
    switch (interaction.type) {
    case InteractionType.ApplicationCommand: {
      await commandHandler(this.commands, interaction);
        
      break;
    }
    case InteractionType.ApplicationCommandAutocomplete: {
      await commandAutocompleteHandler(this.commands, interaction);

      break;
    }
    case InteractionType.MessageComponent:
    case InteractionType.ModalSubmit: {
      const data = await parse(interaction.customId, this.customDataHandler);

      if (data === null) {
        await interaction.reply({
          ephemeral: true,
          content: "This interaction has expired.",
        });
        return; 
      }

      const {componentId, customData} = data;

      const component = this.components[componentId];
      
      if (!component) throw new Error("Requested component does not exist.");

      if (interaction.type === InteractionType.ModalSubmit) {
        if (component.type !== ComponentInteractionType.ModalSubmit) throw new Error("Requested components interaction type does not match interaction.");
  
        await component.runner({interaction, customData});

        break;
      }
        
      switch (interaction.componentType) {
      case ComponentType.Button: {
        if (component.type !== ComponentInteractionType.Button) throw new Error("Requested components interaction type does not match interaction.");
      
        await component.runner({interaction, customData});
      
        break;
      }
      case ComponentType.SelectMenu: {
        if (component.type !== ComponentInteractionType.SelectMenu) throw new Error("Requested components interaction type does not match interaction.");
      
        await component.runner({interaction, customData});
      
        break;
      }
      }

      break;
    }
    }
  }
}