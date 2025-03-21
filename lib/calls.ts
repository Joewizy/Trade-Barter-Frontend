import { Transaction } from "@mysten/sui/transactions";

export default async function callCreateOffer(amount: number, currency_code: string, wallet: any) {
  const tx = new Transaction();
  const packageObjectId = process.env.NEXT_PUBLIC_PACKAGE_ID;
  const [suiCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount * 1000000000)])

  try {
    tx.moveCall({
      target: `${packageObjectId}::Escrow::create_offer`,
      arguments: [suiCoin, tx.pure.string(currency_code)],
    });
    await wallet.signAndExecuteTransaction({
      transaction: tx,
    });

  } catch (error) {
    console.log(error)
  }

}