import { Client, DMChannel, GuildChannel } from "discord.js";
import { Component } from "../components";
import { TypedTypeMap } from "../typings/options";
import { WorthlessPromise } from "../typings/useful";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface HookContext {}

export enum HookType {
  ChannelCreated,
  ChannelDeleted,
}

export interface ChannelCreatedContext extends HookContext {
  channel: GuildChannel;
}

export interface ChannelDeletedContext extends HookContext {
  channel: GuildChannel | DMChannel;
}

export interface HookContextTypeMap extends TypedTypeMap<HookType, HookContext> {
  [HookType.ChannelCreated]: ChannelCreatedContext;
  [HookType.ChannelDeleted]: ChannelDeletedContext;
}

export type HookRunner<T extends HookType> = (context: HookContextTypeMap[T]) => WorthlessPromise;

export class Hook<T extends HookType> {
  associated?: Component[];

  readonly type: T;
  private runnerFunc: HookRunner<T>;

  async runner(context: HookContextTypeMap[T]) {
    await this.runnerFunc(context);
  }

  constructor(type: T, runner: HookRunner<T>, associated?: Component[]) {
    this.type = type;
    this.runnerFunc = runner;
    this.associated = associated;
  }
}

export type AnyHookType = HookType.ChannelCreated | HookType.ChannelDeleted;
export type AnyHook = Hook<HookType.ChannelCreated> | Hook<HookType.ChannelDeleted>;

export type HookContainer = {
  [P in HookType]?: Hook<P>[];

}

/**
 * Runs all hooks with the designated type.
 *
 * @param hookContainer Hook container.
 * @param type Hook type that is getting run.
 * @param context The hook context.
 */
function runHooks<T extends HookType>(hookContainer: HookContainer, type: T, context: HookContextTypeMap[T]) {
  const hooks = hookContainer[type];
  hooks?.forEach(hook => hook.runner(context));
}

/**
 * Registers hooks to the client.
 *
 * @param client Discord.js client.
 * @param hookContainer Hook container.
 */
export function registerHooks(client: Client, hookContainer: HookContainer) {
  client.on("channelCreate", (channel) => runHooks(hookContainer, HookType.ChannelCreated, {channel}));
  client.on("channelDelete", (channel) => runHooks(hookContainer, HookType.ChannelDeleted, {channel}));
}