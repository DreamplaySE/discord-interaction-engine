import Keyv from "keyv";
import { v4 as uuidv4 } from "uuid";

export enum KeyValueStoreStrategy {
  // Everything is stored in custom Id.
  Simple,
  // Stored in custom Id unless data length exceeds max in which case it stores it in key value.
  Hybrid,
  // Stores all custom data in key value store with both component path and data id stored in custom Id.
  Full,
  /*
    Stores only a single data id in custom Id with the custom data as well as the component path stored
    in the key value store. Obfuscates implementation details but requires key value store access for ALL
    component runs regardless of if it stores custom data or not.
  */
  Obfuscate,
}

export type CustomDataHandler = {
  strategy: KeyValueStoreStrategy.Simple;
} | {
  store: Keyv<StoredCustomData<any>>;
  strategy: KeyValueStoreStrategy.Hybrid | KeyValueStoreStrategy.Full | KeyValueStoreStrategy.Obfuscate;
};

export interface StoredCustomData<TCustomData> {
  componentId: string;
  customData: TCustomData;
}

export enum HybridType {
  Clouded = "1",
  Local = "0",
}

export const CUSTOM_DATA_DELIMITER = ":";
const CUSTOM_ID_MAX_LENGTH = 100;

/**
 * Parses custom data from string.
 *
 * @param customId The customId that contains the data/id.
 * @param customDataHandler The custom data handler to use for gathering data.
 */
export async function parse<TCustomData>(customId: string, customDataHandler: CustomDataHandler): Promise<{
  componentId: string;
  customData: TCustomData | null;
} | null> {
  const parts = customId.split(CUSTOM_DATA_DELIMITER);
  const {strategy} = customDataHandler;

  // SAFETY: Assert that it will exist since split will ALWAYS have atleast 1 string, even if its blank.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const id = parts.shift()!;

  if (strategy === KeyValueStoreStrategy.Obfuscate) {
    const storedCustomData = await customDataHandler.store.get(id);

    if (!storedCustomData) return null;

    return storedCustomData;
  }

  // If we're not using obfuscate, id is always component id.
  const componentId = id;

  let value = parts.shift();
  
  if (!value) return {
    componentId,
    customData: null,
  };

  if (strategy === KeyValueStoreStrategy.Simple) {
    return {
      componentId,
      customData: JSON.parse(value),
    };
  }

  if (strategy === KeyValueStoreStrategy.Hybrid) {
    const mode = value.slice(0, 1);
    value = value.slice(1);
    if (mode === HybridType.Local) return {
      componentId,
      customData: JSON.parse(value),
    };
  }
  
  const storedCustomData = await customDataHandler.store.get(value);

  if (storedCustomData === undefined) return {componentId, customData: null};

  if (storedCustomData.componentId !== componentId) throw new Error("Component id in store does not match request.");

  return {componentId, customData: storedCustomData.customData};
}

/**
 * Encodes custom data into a customId.
 *
 * @param componentId The component Id for the component you want to create a custom Id for.
 * @param customData The custom data to encode.
 * @param customDataHandler The custom data handler used to encode the custom data into a custom Id.
 * @param requestId The specific request Id encoded into the custom Id.
 */
export async function encode<TCustomData>(componentId: string, customData: TCustomData, customDataHandler: CustomDataHandler, requestId?: string): Promise<string> {
  const json = JSON.stringify(customData);
  const {strategy} = customDataHandler;

  // Strategy could use concat.
  if (strategy === KeyValueStoreStrategy.Simple) {
    const customId = componentId.concat(CUSTOM_DATA_DELIMITER, json);

    if (customId.length > CUSTOM_ID_MAX_LENGTH) throw new Error("Custom id with data is longer than max! Consider switching to a Custom Data Handler or shorten your data.");
    return customId;
  }

  const {store} = customDataHandler;

  if (strategy === KeyValueStoreStrategy.Hybrid) {
    const customId = componentId.concat(CUSTOM_DATA_DELIMITER, HybridType.Local, json);

    if (customId.length <= CUSTOM_ID_MAX_LENGTH) return customId;
  }

  const key = requestId ?? uuidv4();

  const storedCustomData: StoredCustomData<TCustomData> = {
    componentId: componentId,
    customData,
  };

  await store.set(key, storedCustomData);

  if (strategy === KeyValueStoreStrategy.Hybrid) {
    return componentId.concat(CUSTOM_DATA_DELIMITER, HybridType.Clouded, key);
  }

  if (strategy === KeyValueStoreStrategy.Full) {
    return componentId.concat(CUSTOM_DATA_DELIMITER, key);
  }

  if (strategy === KeyValueStoreStrategy.Obfuscate) return key;

  throw new Error("All should have resolved.");
}