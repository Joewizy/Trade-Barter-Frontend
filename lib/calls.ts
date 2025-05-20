import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { WalletContextState } from "@suiet/wallet-kit";
import { Escrow, Offer } from "@/types/trade.types"; 
import { Trade } from "@/types/trade.types";
import { formatSecondsToDDMMYY } from "./helper-functions";

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


export async function getAllEscrows(address: string): Promise<Escrow[]> {
    const escrowRegistry = await client.getObject({
        id: process.env.NEXT_PUBLIC_ESCROW_REGISTRY_ID as string,
        options: { showContent: true },
    });

    const registryFields = escrowRegistry.data?.content?.fields;
    if (!registryFields) {
        console.error("Escrow registry object has no content fields.");
        return [];
    }

    const userEscrowsId = registryFields.user_escrows?.fields?.id?.id;
    if (!userEscrowsId) {
        console.error("User escrows ID not found in registry object.");
        return [];
    }

    const tableEntries = await client.getDynamicFields({
        parentId: userEscrowsId,
    });

    const userEscrowField = tableEntries.data.find(entry => entry.name.value === address);
    if (!userEscrowField) {
        return [];
    }

    const innerVector = await client.getDynamicFieldObject({
        parentId: userEscrowsId,
        name: userEscrowField.name,
    });

    const vectorValue = innerVector.data?.content?.fields?.value;
    if (!Array.isArray(vectorValue)) {
        console.warn("No escrow IDs found for the user.");
        return [];
    }

    const allEscrowsIds = vectorValue as string[];

    try {
        const escrowObjects = await client.multiGetObjects({
            ids: allEscrowsIds,
            options: { showContent: true },
        });
        console.log("Escrow Objects", escrowObjects)
        const escrows: Escrow[] = escrowObjects
            .map((obj) => {
                if (!obj.data || obj.error) {
                    console.warn(`Escrow object not found or errored: ${obj.data?.objectId}`, obj.error);
                    return null;
                }

                const fields = obj.data.content?.fields;
                if (!fields) {
                    console.warn(`Escrow object has no content fields: ${obj.data.objectId}`);
                    return null;
                }

                let amount: number;
                if (typeof fields.locked_coin === "string") {
                    amount = Number(fields.locked_coin);
                } else if (fields.locked_coin && typeof fields.locked_coin === "object" && fields.locked_coin.fields?.value) {
                    amount = Number(fields.locked_coin.fields.value);
                } else {
                    console.warn(`Invalid locked_coin format for escrow ${obj.data.objectId}`, fields);
                    return null;
                }

                return {
                    id: obj.data.objectId,
                    offerId: fields.offer_id ?? "",
                    seller: fields.seller ?? "",
                    buyer: fields.buyer ?? "",
                    amount,
                    fiatAmount: Number(fields.fiat_amount ?? 0),
                    status: fields.status ?? "PENDING",
                    createdAt: new Date(Number(fields.created_at ?? 0)).toISOString(),
                };
            })
            .filter((e): e is Escrow => e !== null);

        return escrows;
    } catch (error) {
        console.error("Error fetching escrows:", error);
        return [];
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

export async function getAllOffers(): Promise<Offer[]> {
  const offerRegistry = await client.getObject({
    id: process.env.NEXT_PUBLIC_OFFER_REGISTRY_ID as string,
    options: { showContent: true },
  });

  const userOffersId = offerRegistry.data?.content?.fields?.user_offers?.fields?.id?.id;
  if (!userOffersId) {
    console.error("User offers ID not found in registry object.");
    return [];
  }

  const tableEntries = await client.getDynamicFields({
    parentId: userOffersId,
  });

  const offerIds: string[] = [];

  for (const entry of tableEntries.data) {
    try {
      const innerVector = await client.getDynamicFieldObject({
        parentId: userOffersId,
        name: { type: "address", value: entry.name.value },
      });

      const vectorValue = innerVector.data?.content?.fields?.value;
      if (Array.isArray(vectorValue)) {
        offerIds.push(...vectorValue);
      } else {
        console.warn("Unexpected or missing 'value' field in dynamic field object:", innerVector.data);
      }
    } catch (error) {
      console.error("Error fetching dynamic field object for entry:", entry, error);
    }
  }

  if (offerIds.length === 0) {
    console.info("No offer IDs found.");
    return [];
  }

  const offerObjects = await client.multiGetObjects({
    ids: offerIds,
    options: { showContent: true },
  });

  const offers: Offer[] = offerObjects
    .map((obj) => {
      const fields = obj.data?.content?.fields;
      if (!fields) return null;

      try {
        console.log("Offer Structure:", JSON.stringify(fields, null, 2));

        // Parse lockedAmount with full flexibility
        let lockedAmount = 0;
        const rawLockedAmount = fields.locked_amount;

        if (typeof rawLockedAmount === "string" || typeof rawLockedAmount === "number") {
          lockedAmount = Number(rawLockedAmount);
        } else if (typeof rawLockedAmount === "object" && rawLockedAmount !== null) {
          if (typeof rawLockedAmount.value === "string" || typeof rawLockedAmount.value === "number") {
            lockedAmount = Number(rawLockedAmount.value);
          } else if (rawLockedAmount.fields?.value) {
            lockedAmount = Number(rawLockedAmount.fields.value);
          }
        }

        // Optional: Convert mist to SUI (comment this out if you want raw numbers)
        lockedAmount = lockedAmount / 1e9;

        return {
          id: obj.data.objectId,
          owner: fields.owner,
          currencyCode: fields.currency_code,
          lockedAmount,
          activeEscrows: Number(fields.active_escrows ?? 0),
          price: Number(fields.price ?? 0),
          paymentType: fields.payment_type,
        };
      } catch (error) {
        console.error("Error parsing offer object:", obj, error);
        return null;
      }
    })
    .filter((o): o is Offer => o !== null);

  return offers;
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

export async function getAllEscrowsWithDetails(address: string): Promise<Trade[]> {
  try {
    // Fetch user's escrows
    const escrows = await getAllEscrows(address);
    if (!escrows.length) return [];

    // Map escrows to trades with additional data
    const tradePromises = escrows.map(async (escrow) => {
      try {
        // Fetch offer details
        const offerObj = await client.getObject({
          id: escrow.offerId,
          options: { showContent: true },
        });
        const offerFields = offerObj.data?.content?.fields || {};

        // Default values in case fields are missing
        const price = Number(offerFields.price || 0);
        const currency = offerFields.currency_code || "UNKNOWN";
        const paymentMethod = offerFields.payment_type || "UNKNOWN";

        // Variables to store profile information
        let sellerProfile = {
          name: "Unknown Seller",
          contact: "",
          email: "",
          totalTrades: 0,
          completedTrades: 0,
          disputes: 0
        };
        
        let buyerProfile = {
          name: "Unknown Buyer",
          contact: "",
          email: "",
          totalTrades: 0,
          completedTrades: 0,
          disputes: 0
        };

        // Get the profile registry object
        try {
          const registryObj = await client.getObject({
            id: process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ID as string,
            options: { showContent: true }
          });
          
          // If registry exists, try to get profiles
          if (registryObj.data?.content?.fields?.user_profiles) {
            const profilesTableId = registryObj.data.content.fields.user_profiles.fields.id.id;
            
            // Try to get seller profile
            try {
              const sellerProfileObj = await client.getDynamicFieldObject({
                parentId: profilesTableId,
                name: { type: "address", value: escrow.seller }
              });
              
              const sellerProfileData = sellerProfileObj.data?.content?.fields?.value?.fields;
              if (sellerProfileData) {
                sellerProfile = {
                  name: sellerProfileData.name || "Unknown Seller",
                  contact: sellerProfileData.contact || "",
                  email: sellerProfileData.email || "",
                  totalTrades: Number(sellerProfileData.total_trades || 0),
                  completedTrades: Number(sellerProfileData.completed_trades || 0),
                  disputes: Number(sellerProfileData.disputes || 0)
                };
              }
            } catch (sellerError) {
              console.warn(`Failed to fetch seller profile for ${escrow.seller}:`, sellerError);
            }
            
            // Try to get buyer profile
            try {
              const buyerProfileObj = await client.getDynamicFieldObject({
                parentId: profilesTableId,
                name: { type: "address", value: escrow.buyer }
              });
              
              const buyerProfileData = buyerProfileObj.data?.content?.fields?.value?.fields;
              if (buyerProfileData) {
                buyerProfile = {
                  name: buyerProfileData.name || "Unknown Buyer",
                  contact: buyerProfileData.contact || "",
                  email: buyerProfileData.email || "",
                  totalTrades: Number(buyerProfileData.total_trades || 0),
                  completedTrades: Number(buyerProfileData.completed_trades || 0),
                  disputes: Number(buyerProfileData.disputes || 0)
                };
              }
            } catch (buyerError) {
              console.warn(`Failed to fetch buyer profile for ${escrow.buyer}:`, buyerError);
            }
          }
        } catch (registryError) {
          console.warn("Failed to fetch profile registry:", registryError);
        }

        // Format wallet addresses for display
        const formatWalletAddress = (addr: string) => {
          if (!addr) return "";
          return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
        };

        return {
          id: escrow.id,
          type: address === escrow.seller ? 'sell' : 'buy',
          status: escrow.status.toLowerCase() as 'pending' | 'completed' | 'dispute' | 'cancelled',
          price: price,
          currency: currency,
          crypto: 'SUI',
          amount: escrow.amount / 1e9, // Convert from MIST to SUI
          fiatAmount: escrow.fiatAmount,
          paymentMethod: paymentMethod,
          merchant: { 
            name: address === escrow.seller ? buyerProfile.name : sellerProfile.name,
            address: address === escrow.seller ? escrow.buyer : escrow.seller,
            shortAddress: address === escrow.seller ? formatWalletAddress(escrow.buyer) : formatWalletAddress(escrow.seller),
            totalTrades: address === escrow.seller ? buyerProfile.totalTrades : sellerProfile.totalTrades,
            completedTrades: address === escrow.seller ? buyerProfile.completedTrades : sellerProfile.completedTrades,
            disputes: address === escrow.seller ? buyerProfile.disputes : sellerProfile.disputes
          },
          createdAt: escrow.createdAt,
          // Add these fields for additional reference if needed
          offerId: escrow.offerId,
          seller: {
            address: escrow.seller,
            shortAddress: formatWalletAddress(escrow.seller),
            profile: sellerProfile
          },
          buyer: {
            address: escrow.buyer,
            shortAddress: formatWalletAddress(escrow.buyer),
            profile: buyerProfile
          },
          // Additional fields for timestamps and calculations
          timestamp: new Date(escrow.createdAt).getTime(),
          formattedDate: new Date(escrow.createdAt).toLocaleDateString(),
          formattedTime: new Date(escrow.createdAt).toLocaleTimeString()
        };
      } catch (individualTradeError) {
        console.warn(`Failed to process escrow ${escrow.id}:`, individualTradeError);
        // Return a minimal valid trade object with error indication
        return {
          id: escrow.id,
          type: address === escrow.seller ? 'sell' : 'buy',
          status: 'pending' as 'pending',
          price: 0,
          currency: "ERROR",
          crypto: 'SUI',
          amount: escrow.amount / 1e9,
          fiatAmount: 0,
          paymentMethod: "Unknown",
          merchant: { 
            name: "Error loading data",
            address: "",
            shortAddress: "",
            totalTrades: 0,
            completedTrades: 0,
            disputes: 0
          },
          createdAt: escrow.createdAt || new Date().toISOString(),
          offerId: escrow.offerId || "",
          seller: { address: escrow.seller || "", shortAddress: "", profile: { name: "Unknown" } },
          buyer: { address: escrow.buyer || "", shortAddress: "", profile: { name: "Unknown" } },
          timestamp: new Date(escrow.createdAt).getTime(),
          formattedDate: formatSecondsToDDMMYY(Math.floor(new Date(escrow.createdAt).getTime() / 1000)), 
          formattedTime: new Date(escrow.createdAt).toLocaleTimeString() 
        };
      }
    });

    // Handle any promise rejections during the Promise.all
    const trades = await Promise.all(tradePromises);
    return trades;
  } catch (error) {
    console.error("Error fetching trades:", error);
    return [];
  }
}