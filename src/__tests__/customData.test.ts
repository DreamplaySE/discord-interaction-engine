jest.dontMock("keyv");

const Keyv = require("keyv");
import { CustomData, CustomDataHandler, CUSTOM_DATA_DELIMITER, HybridType, KeyValueStoreStrategy } from "../components/customData";

const generateValueStoreTest = <T extends CustomDataHandler>(customDataHandler: T) => async () => {
  const requestId = "requestId";
  const customData = "customData";
  const componentId = "componentId";

  const customId = await CustomData.encode(componentId, customData, customDataHandler, requestId);

  const storedData = await CustomData.parse(customId, customDataHandler);

  expect(storedData?.customData).toBe(customData);
  expect(storedData?.componentId).toBe(componentId);
};

test('Obfuscate KeyValueStoreStrategy encoding works.', generateValueStoreTest({
  store: new Keyv(),
  strategy: KeyValueStoreStrategy.Obfuscate,
}));

test('Full KeyValueStoreStrategy encoding works.', generateValueStoreTest({
  store: new Keyv(),
  strategy: KeyValueStoreStrategy.Full,
}));

test('Hybrid KeyValueStoreStrategy encoding works.', generateValueStoreTest({
  store: new Keyv(),
  strategy: KeyValueStoreStrategy.Hybrid,
}));

test('Simple KeyValueStoreStrategy encoding works.', generateValueStoreTest({
  strategy: KeyValueStoreStrategy.Simple,
}));

test('Simple KeyValueStoreStrategy throws error if it tries to encode something out of size.', async () => {
  const customDataHandler: CustomDataHandler = {
    strategy: KeyValueStoreStrategy.Simple,
  };
  
  const requestId = "requestId";
  const customData = "a".repeat(1000);
  const componentId = "componentId";

  try {
    const customId = await CustomData.encode(componentId, customData, customDataHandler, requestId);
    fail();    
  } catch (error) {}
});

test('Hybrid uses Simple strategy if smaller than max length.', async () => {
  const simpleCustomDataHandler: CustomDataHandler = {
    strategy: KeyValueStoreStrategy.Simple,
  };
  const hybridCustomDataHandler: CustomDataHandler = {
    strategy: KeyValueStoreStrategy.Hybrid,
    store: new Keyv(),
  };
  
  const requestId = "requestId";
  const customData = "a".repeat(50);
  const componentId = "componentId";

  const hybridCustomId = await CustomData.encode(componentId, customData, hybridCustomDataHandler, requestId);
  expect(hybridCustomId).toBe(componentId.concat(CUSTOM_DATA_DELIMITER, HybridType.Local, JSON.stringify(customData)));
});

test('Hybrid uses Full strategy if larger than max length.', async () => {
  const fullCustomDataHandler: CustomDataHandler = {
    strategy: KeyValueStoreStrategy.Full,
    store: new Keyv(),
  };
  const hybridCustomDataHandler: CustomDataHandler = {
    strategy: KeyValueStoreStrategy.Hybrid,
    store: new Keyv(),
  };
  
  const requestId = "requestId";
  const customData = "a".repeat(1000);
  const componentId = "componentId";

  const hybridCustomId = await CustomData.encode(componentId, customData, hybridCustomDataHandler, requestId);
  expect(hybridCustomId).toBe(componentId.concat(CUSTOM_DATA_DELIMITER, HybridType.Clouded, requestId));
});