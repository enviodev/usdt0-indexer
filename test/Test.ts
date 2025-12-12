import assert from "assert";
import { 
  TestHelpers,
  TransparentUpgradeableProxy_OFTReceived
} from "generated";
const { MockDb, TransparentUpgradeableProxy } = TestHelpers;

describe("TransparentUpgradeableProxy contract OFTReceived event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for TransparentUpgradeableProxy contract OFTReceived event
  const event = TransparentUpgradeableProxy.OFTReceived.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("TransparentUpgradeableProxy_OFTReceived is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await TransparentUpgradeableProxy.OFTReceived.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualTransparentUpgradeableProxyOFTReceived = mockDbUpdated.entities.TransparentUpgradeableProxy_OFTReceived.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedTransparentUpgradeableProxyOFTReceived: TransparentUpgradeableProxy_OFTReceived = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      guid: event.params.guid,
      srcEid: event.params.srcEid,
      toAddress: event.params.toAddress,
      amountReceivedLD: event.params.amountReceivedLD,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualTransparentUpgradeableProxyOFTReceived, expectedTransparentUpgradeableProxyOFTReceived, "Actual TransparentUpgradeableProxyOFTReceived should be the same as the expectedTransparentUpgradeableProxyOFTReceived");
  });
});
