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

function getEidFromChainId(chainId: number): number | undefined {
  return Object.entries(EID_TO_CHAIN_ID)
    .find(([, value]) => value === chainId)
    ?.at(0)
    ? Number(
        Object.entries(EID_TO_CHAIN_ID).find(
          ([, value]) => value === chainId
        )![0]
      )
    : undefined;
}

function startOfDayUTC(timestamp: number): number {
  const date = new Date(timestamp * 1000);

  date.setUTCHours(0, 0, 0, 0);

  return Math.floor(date.getTime() / 1000);
}

USDT0.OFTReceived.handler(async ({ event, context }) => {
  // getOrCreate a USDT0Transfer entity
  let transfer: USDT0Transfer = await context.USDT0Transfer.getOrCreate({
    id: event.params.guid,
    srcChain: 0,
    dstChain: 0,
    fromAddress: ZERO_ADDRESS, // will be set in OFTSent event
    toAddress: ZERO_ADDRESS,
    amountSent: 0,
    amountReceived: 0,
    txHashReceived: "",
    txHashSent: "",
  });

  // Note: As our current indexer is single-chain, there can be USDT0Transfer entities
  // that have fromAddress as ZERO_ADDRESS. This will be fixed when multi-chain support is added
  // along with support for all chains that USDT0 is deployed on.

  transfer = {
    ...transfer,
    srcChain:
      transfer.srcChain == 0 ? EID_TO_CHAIN_ID[Number(event.params.srcEid)] : transfer.srcChain,

    dstChain: transfer.dstChain == 0 ? event.chainId : transfer.dstChain,

    toAddress: event.params.toAddress,
    amountReceived: bigIntToDecimal(event.params.amountReceivedLD, 6),
    txHashReceived: event.transaction.hash,
  };

  // TODO: check received amount is same as received amount from OFTSent event

  // set that entity
  context.USDT0Transfer.set(transfer);

  const startOfDayTS = startOfDayUTC(event.block.timestamp);
  let dailySnapshotId = `${transfer.srcChain}-${startOfDayTS}`;

  let dailyStats = await context.dailyUSDT0TransferStats.getOrCreate({
    id: dailySnapshotId,
    date: startOfDayTS,
    totalSentTransfers: 0,
    totalReceivedTransfers: 0,
    totalAmountSent: 0,
    totalAmountReceived: 0,
  });

  dailyStats = {
    ...dailyStats,
    totalReceivedTransfers: dailyStats.totalReceivedTransfers + 1,
    totalAmountReceived:
      dailyStats.totalAmountReceived + transfer.amountReceived,
  };

  context.dailyUSDT0TransferStats.set(dailyStats);
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
    txHashReceived: "",
    txHashSent: "",
  });

  transfer = {
    ...transfer,
    // set chains in OFTSent event
    srcChain: event.chainId ,
    dstChain: EID_TO_CHAIN_ID[Number(event.params.dstEid)],
    fromAddress: event.params.fromAddress,
    amountSent: bigIntToDecimal(event.params.amountSentLD, 6),
    amountReceived: bigIntToDecimal(event.params.amountSentLD, 6),
    txHashSent: event.transaction.hash,
  };

  // update amountReceived
  context.USDT0Transfer.set(transfer);

  // TODO: update dailyUSDT0TransferStats entity
  const startOfDayTS = startOfDayUTC(event.block.timestamp);
  let dailySnapshotId = `${transfer.dstChain}-${startOfDayTS}`;

  let dailyStats = await context.dailyUSDT0TransferStats.getOrCreate({
    id: dailySnapshotId,
    date: startOfDayTS,
    totalSentTransfers: 0,
    totalReceivedTransfers: 0,
    totalAmountSent: 0,
    totalAmountReceived: 0,
  });

  dailyStats = {
    ...dailyStats,
    totalSentTransfers: dailyStats.totalSentTransfers + 1,
    totalAmountSent: dailyStats.totalAmountSent + transfer.amountSent,
  };

  context.dailyUSDT0TransferStats.set(dailyStats);
});
