import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { WalletContextState } from "@suiet/wallet-kit";

export async function callCreateOffer(values: {
  price: number,
  amount: number,
  currency_code: string,
  payment_type: string
}, wallet: WalletContextState) {
  const tx = new Transaction();
  const packageObjectId = process.env.NEXT_PUBLIC_PACKAGE_ID;
  const amountInMist = values.amount * 1000000000;
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)])

  tx.setGasBudget(10000000);

  try {
    tx.moveCall({
      target: `${packageObjectId}::Escrow::create_offer`,
      arguments: [
        tx.pure.string(values.currency_code),
        tx.pure.u64(values.price),
        tx.pure.string(values.payment_type),
        coin,
      ],
    });
    await wallet.signAndExecuteTransaction({
      transaction: tx,
    });
    return { result: true }

  } catch (error: any) {
    console.log(error)
    return { result: error.message };
  }

}

export async function checkProfileExists(wallet: WalletContextState) {
  const client = new SuiClient({
    url: getFullnodeUrl('testnet')
  });

  try {
    // Query the dynamic field for the wallet address in the profiles table
    const registryObject = await client.getObject({
      id: process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ID as string,
      options: {
        showContent: true
      }
    });

    if (registryObject.data?.content?.fields?.profiles) {
      const profilesTable = registryObject.data.content.fields.profiles;

      // Check if the address exists in the table using dynamic field apis
      const dynamicFields = await client.getDynamicFields({
        parentId: profilesTable.fields.id.id
      });

      // Look for the address in the returned fields
      return { result: dynamicFields.data.some(field => field.name.value === wallet.address) }
    } else {
      console.error("Could not access profiles table in registry");
      return { result: false };
    }
  } catch (error) {
    console.error('Error checking profile:', error);
    return { result: false };
  }

}

export async function createProfile(values: {
  username: string,
  email: string,
  phone: string,
}, wallet: any) {
  const tx = new Transaction();
  const packageObjectId = process.env.NEXT_PUBLIC_PACKAGE_ID;

  try {
    tx.moveCall({
      target: `${packageObjectId}::Escrow::create_user_profile`,
      arguments: [
        tx.pure.string(values.username),
        tx.pure.string(values.email),
        tx.pure.string(values.phone),
        tx.object(process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ID as string)
      ],
    });
    await wallet.signAndExecuteTransaction({
      transaction: tx,
    });

    return { result: true }

  } catch (error: any) {
    console.log(error)
    return { result: error.message };
  }




}
