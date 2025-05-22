  // ========================
  // Generic Trade UI Mapping
  // ========================
  export interface Trade {
    id: string;
    type: 'buy' | 'sell';
    status: 'pending' | 'completed' | 'dispute' | 'cancelled';
    price: number;
    currency: string; // e.g., "USD"
    crypto: string; // e.g., "BTC", "ETH", "SUI"
    amount: number; // Crypto amount
    fiatAmount: number; // Fiat equivalent
    paymentMethod: string; // e.g., "Bank Transfer"
    merchant: {
      name: string;
    };
    createdAt: string; // ISO 8601 timestamp
}

export interface UserProfile {
    name: string;
    contact: string;
    email: string;
    owner: string; // Sui address
    joinedDate: number; // Epoch timestamp in milliseconds
    totalTrades: number;
    disputes: number;
    completedTrades: number;
    averageSettlementTime: number; // In milliseconds
  }
  
  export interface Offer {
    id: string;
    owner: string;
    currencyCode: string;
    lockedAmount: number; // SUI amount locked in the offer
    activeEscrows: number;
    price: number; // Fiat price per unit of crypto
    paymentType: string;
  }


export interface Escrow {
  id: string;
  offerId: string;
  seller: string;
  buyer: string;
  amount: number; // SUI amount locked_coin
  fiatAmount: number;
  status: "PENDING" | "COMPLETED" | "DISPUTE" | "CANCELLED";
  createdAt: string; // ISO 8601 timestamp
}
  
  // ========================
  // Events
  // ========================
  export interface EscrowCreatedEvent {
    escrowId: string;
    offerId: string;
    seller: string;
    buyer: string;
    lockedCoin: number;
    fiatAmount: number;
    status: string;
    createdAt: number;
  }
  
  export interface PaymentConfirmedEvent {
    escrowId: string;
    confirmedBy: string;
  }
  
  export interface DisputeRaisedEvent {
    escrowId: string;
    seller: string;
    buyer: string;
  }
  
  export interface PaymentConfirmedDuringDisputeEvent {
    escrowId: string;
    seller: string;
  }
  
  export type LearningModule = {
  id: string
  title: string
  description: string
  duration: string
  difficulty: string
  progress: number
  completed: boolean
  locked?: boolean
  nftReward: {
    name: string
    image: string
  }
}

export type NFTReward = {
  id: string
  name: string
  description: string
  image: string
  acquired: boolean
  date?: string
}

export interface MockTrade {
  id: string
  type: "buy" | "sell"
  price: number
  currency: string
  crypto: string
  amount: number
  fiatAmount: number
  paymentMethod: string
  merchant: {
    name: string
  }
  createdAt: string
  status: "pending" | "completed" | "dispute" | "cancelled"
  messages: {
    id: string
    sender: "user" | "system" | "merchant"
    content: string
    timestamp: string
  }[]
}
