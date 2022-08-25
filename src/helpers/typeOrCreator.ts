export type TypeOrCreator<T, InteractionContext> = ((context: InteractionContext) => T) | T;

export const valueOrCreate = <T, InteractionContext>(typeOrCreator: TypeOrCreator<T, InteractionContext>, context: InteractionContext): T =>
  typeOrCreator instanceof Function ? typeOrCreator(context) : typeOrCreator;