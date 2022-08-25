type StringToType<
  Key extends string,
  TypeMap extends Record<Key, any>
> = Key extends keyof TypeMap ? TypeMap[Key] : never;

export interface Option<T> {
  readonly type: T;
}

export interface OptionalOption<T> extends Option<T> {
  readonly required?: boolean;
}

export type Options<
  T extends string = string,
  U extends Option<T> = Option<T>,
> = {
  readonly [key: string]: U,
};

export type TypedTypeMap<KeyType extends string | number | symbol, ValueType = any> = Record<KeyType, ValueType>;

export type Transform<
  OptionType extends Option<KeyType>,
  TypeMap extends TypedTypeMap<KeyType>,
  KeyType extends string,
  OptionsType extends Options<KeyType, OptionType> = Options<KeyType, OptionType>,
> = {
  [Property in keyof OptionsType]: (OptionsType[Property] extends OptionalOption<KeyType> ?
      (OptionsType[Property]["required"] extends true ?
        StringToType<OptionsType[Property]["type"], TypeMap> :
        (StringToType<OptionsType[Property]["type"], TypeMap> | undefined)
      ) :
      StringToType<OptionsType[Property]["type"], TypeMap>
    );
}