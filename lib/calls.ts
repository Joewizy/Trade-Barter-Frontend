import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { WalletContextState } from "@suiet/wallet-kit";

const client = new SuiClient({
  url: getFullnodeUrl('testnet')
});
const packageObjectId = process.env.NEXT_PUBLIC_PACKAGE_ID;

export async function callCreateOffer(values: {
  price: number,
  amount: number, // sui_coin
  currency_code: string,
  payment_type: string
}, wallet: WalletContextState) {
  const tx = new Transaction();
  const amountInMist = values.amount * 1000000000;
  const coin = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)])

  tx.setGasBudget(10000000);

  try {
    tx.moveCall({
      target: `${packageObjectId}::Escrow::create_offer`,
      arguments: [
        tx.pure.string(values.currency_code),
        tx.pure.u64(values.price),
        tx.pure.string(values.payment_type),
        coin[0],
        tx.object(process.env.NEXT_PUBLIC_OFFER_REGISTRY_ID as string),
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

export async function checkProfileExists(wallet: WalletContextState) {

  try {
    // Query the dynamic field for the wallet address in the profiles table
    const registryObject = await client.getObject({
      id: process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ID as string,
      options: {
        showContent: true
      }
    });

    if (registryObject.data?.content?.fields?.user_profiles) {
      const profilesTable = registryObject.data.content.fields.user_profiles;

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

  try {
    tx.moveCall({
      target: `${packageObjectId}::Escrow::create_user_profile`,
      arguments: [
        tx.pure.string(values.username),
        tx.pure.string(values.phone),
        tx.pure.string(values.email),
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

export async function getAllOffers() {
  // 1. Fetch the OfferRegistry object
  const offerRegistry = await client.getObject({
    id: process.env.NEXT_PUBLIC_OFFER_REGISTRY_ID as string,
    options: { showContent: true }
  });
  
  // 2. Get all entries in the user_offers table
  if (!offerRegistry.data?.content?.fields?.user_offers?.fields?.id?.id) {
    return [];
  }
  const tableId = offerRegistry.data.content.fields.user_offers.fields.id.id;
  
  // Get all table entries
  const tableEntries = await client.getDynamicFields({
    parentId: tableId
  });
  
  // 3. For each address in the table, get their offers
  const allOffers = [];
  
  for (const entry of tableEntries.data) {
    const address = entry.name.value;
    
    // Get the vector of offer IDs for this address
    const offerIdsObj = await client.getDynamicFieldObject({
      parentId: tableId,
      name: { type: 'address', value: address }
    });
    
    if (!offerIdsObj.data?.content?.fields?.value) {
      continue;
    }
    
    const offerIds = offerIdsObj.data.content.fields.value;
    
    // 4. Fetch each offer object using its ID
    for (const offerId of offerIds) {
      const offer = await client.getObject({
        id: offerId,
        options: { showContent: true }
      });
      
      allOffers.push(offer.data);
    }
  }
  
  return allOffers;
}

export async function getUserEscrows(walletAddress: string) {
  const escrowRegistry = await client.getObject({
    id: process.env.NEXT_PUBLIC_ESCROW_REGISTRY_ID as string,
    options: { showContent: true },
  });

  if (!escrowRegistry.data?.content?.fields?.user_escrows?.fields?.id?.id) {
    return [];
  }

  const tableId = escrowRegistry.data.content.fields.user_escrows.fields.id.id;
  const escrowIdsObj = await client.getDynamicFieldObject({
    parentId: tableId,
    name: { type: 'address', value: walletAddress },
  });

  if (!escrowIdsObj.data?.content?.fields?.value) {
    return [];
  }

  const escrowIds = escrowIdsObj.data.content.fields.value;
  const allEscrows = [];

  for (const escrowId of escrowIds) {
    const escrow = await client.getObject({
      id: escrowId,
      options: { showContent: true },
    });
    allEscrows.push(escrow.data);
  }

  return allEscrows;
}

export async function createEscrow(offerId: string, amount: number, wallet: WalletContextState) {
  const tx = new Transaction();

  try {
    tx.moveCall({
      target: `${packageObjectId}::Escrow::create_escrow`,
      arguments: [
        tx.pure.u64(amount),
        tx.object(offerId),
        tx.object(process.env.NEXT_PUBLIC_ESCROW_REGISTRY_ID as string),
        tx.object(process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ID as string)
      ],
    });
    await wallet.signAndExecuteTransaction({
      transaction: tx,
    });
    return { result: true }
  } catch (error: any) {
    console.error(error)
    return { result: error.message };
  }
}

export async function confirmPayment(escrowId: string, offerId: string, wallet: WalletContextState) {
  const tx = new Transaction();

  try {
    tx.moveCall({
      target: `${packageObjectId}::Escrow::confirm_payment`,
      arguments: [
        tx.object(process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ID as string),
        tx.object(escrowId),
        tx.object(offerId),
      ],
    });
    await wallet.signAndExecuteTransaction({
      transaction: tx,
    });
    return { result: true };
  } catch (error: any) {
    console.error(error);
    return { result: error.message };
  }
}

// Cancel an escrow and return funds to the offer
export async function cancelEscrow(escrowId: string, offerId: string, wallet: WalletContextState) {
  const tx = new Transaction();

  try {
    tx.moveCall({
      target: `${packageObjectId}::Escrow::cancel_escrow`,
      arguments: [
        tx.object(escrowId),
        tx.object(offerId),
      ],
    });
    await wallet.signAndExecuteTransaction({
      transaction: tx,
    });
    return { result: true };
  } catch (error: any) {
    console.error(error);
    return { result: error.message };
  }
}

// Delete an offer if no active escrows exist
export async function deleteOffer(offerId: string, wallet: WalletContextState) {
  const tx = new Transaction();

  try {
    tx.moveCall({
      target: `${packageObjectId}::Escrow::delete_offer`,
      arguments: [
        tx.object(offerId),
        tx.object(process.env.NEXT_PUBLIC_OFFER_REGISTRY_ID as string),
      ],
    });
    await wallet.signAndExecuteTransaction({
      transaction: tx,
    });
    return { result: true };
  } catch (error: any) {
    console.error(error);
    return { result: error.message };
  }
}

// Raise a dispute on an escrow
export async function makeDispute(escrowId: string, wallet: WalletContextState) {
  const tx = new Transaction();

  try {
    tx.moveCall({
      target: `${packageObjectId}::Escrow::make_dispute`,
      arguments: [
        tx.object(escrowId),
        tx.object(process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ID as string),
      ],
    });
    await wallet.signAndExecuteTransaction({
      transaction: tx,
    });
    return { result: true };
  } catch (error: any) {
    console.error(error);
    return { result: error.message };
  }
}

// Admin function to force complete a trade in dispute
export async function forceCompleteTrade(escrowId: string, offerId: string, wallet: WalletContextState) {
  const tx = new Transaction();

  try {
    tx.moveCall({
      target: `${packageObjectId}::Escrow::force_complete_trade`,
      arguments: [
        tx.object(process.env.NEXT_PUBLIC_DEPLOYER_ID as string),
        tx.object(escrowId),
        tx.object(offerId),
        tx.object(process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ID as string),
      ],
    });
    await wallet.signAndExecuteTransaction({
      transaction: tx,
    });
    return { result: true };
  } catch (error: any) {
    console.error(error);
    return { result: error.message };
  }
}

// Admin function to refund the seller in a dispute
export async function refundSeller(escrowId: string, offerId: string, wallet: WalletContextState) {
  const tx = new Transaction();

  try {
    tx.moveCall({
      target: `${packageObjectId}::Escrow::refund_seller`,
      arguments: [
        tx.object(process.env.NEXT_PUBLIC_DEPLOYER_ID as string),
        tx.object(escrowId),
        tx.object(offerId),
      ],
    });
    await wallet.signAndExecuteTransaction({
      transaction: tx,
    });
    return { result: true };
  } catch (error: any) {
    console.error(error);
    return { result: error.message };
  }
}

// Resolve a dispute as the seller
export async function resolveDispute(escrowId: string, wallet: WalletContextState) {
  const tx = new Transaction();

  try {
    tx.moveCall({
      target: `${packageObjectId}::Escrow::resolve_dispute`,
      arguments: [
        tx.object(escrowId),
      ],
    });
    await wallet.signAndExecuteTransaction({
      transaction: tx,
    });
    return { result: true };
  } catch (error: any) {
    console.error(error);
    return { result: error.message };
  }
}

// HELPER FUNCTIONS
/**
 * Gets object IDs (like offers or escrows) associated with a wallet address from a dynamic field table.
 */
export async function getUserObjectIdsFromTable(
  client: SuiClient,
  tableId: string,
  address: string
): Promise<string[]> {
  try {
    const res = await client.getDynamicFieldObject({
      parentId: tableId,
      name: { type: "address", value: address },
    });

    const ids = res.data?.content?.fields?.value;
    return Array.isArray(ids) ? ids : [];
  } catch (err) {
    console.error("Error fetching dynamic field object:", err);
    return [];
  }
}