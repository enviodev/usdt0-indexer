/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { USDT0, USDT0Transfer } from "generated";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function bigIntToDecimal(value: bigint, decimals: number): number {
  const base = 10n ** BigInt(decimals);
  const integer = value / base;
  const fraction = value % base;
  return Number(integer) + Number(fraction) / Number(base);
}

const EID_TO_CHAIN_ID: Record<number, number> = {
  30101: 1,
  30110: 42161,
  30109: 137,
  30362: 80094,
  30339: 57073,
  30111: 10,
  30320: 130,
  30331: 21000000,
  30280: 1329,
  30295: 14,
  30367: 999,
  30333: 30,
  30274: 196,
  30383: 9745,
  30212: 1030,
  30181: 5000,
  30390: 143,
  30396: 988,
};

USDT0.OFTReceived.handler(async ({ event, context }) => {
  // getOrCreate a USDT0Transfer entity
  let transfer: USDT0Transfer = await context.USDT0Transfer.getOrCreate({
    id: event.params.guid,
    srcChain: 0,
    dstChain: 0,
    fromAddress: ZERO_ADDRESS,
    toAddress: ZERO_ADDRESS,
    amountSent: 0,
    amountReceived: 0,
  });

  transfer = {
    ...transfer,
    // set chains in OFTSent event
    toAddress: event.params.toAddress,
  };

  // TODO: check received amount is same as received amount from OFTSent event

  // set that entity
  context.USDT0Transfer.set(transfer);
});

USDT0.OFTSent.handler(async ({ event, context }) => {
  // getOrCreate the USDT0Transfer entity
  let transfer: USDT0Transfer = await context.USDT0Transfer.getOrCreate({
    id: event.params.guid,
    srcChain: 0,
    dstChain: 0,
    fromAddress: ZERO_ADDRESS,
    toAddress: ZERO_ADDRESS,
    amountSent: 0,
    amountReceived: 0,
  });

  let amountSent = event.params.amountSentLD;

  transfer = {
    ...transfer,
    // set chains in OFTSent event
    srcChain: EID_TO_CHAIN_ID[event.chainId] || 0,
    dstChain: EID_TO_CHAIN_ID[Number(event.params.dstEid)] || 0,
    fromAddress: event.params.fromAddress,
    amountSent: bigIntToDecimal(event.params.amountSentLD, 6),
    amountReceived: bigIntToDecimal(event.params.amountSentLD, 6),
  };

  // update amountReceived
  context.USDT0Transfer.set(transfer);
});
