module defihub::Escrow {
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, UID, ID};
    use sui::balance::{Self, Balance};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::sui::SUI;
    use std::string::{Self, String};
    use sui::table::{Self, Table};

    // ======== ERRORS ========
    const E_NOT_OWNER: u64 = 1;
    const E_NOT_SELLER: u64 = 2;
    const E_NOT_BUYER: u64 = 3;
    const E_INVALID_STATE: u64 = 4;
    const E_INVALID_AMOUNT: u64 = 5;
    const E_ALREADY_EXISTS: u64 = 6;
    const E_INVALID_OFFER: u64 = 7;
    const E_NO_USER_PROFILE: u64 = 8;
   const E_CANNOT_BUY_OWN_OFFER: u64 = 9;

    // ======== STRUCTURES ========
    public struct ProfileRegistry has key {
        id: UID,
        user_profiles: Table<address, UserProfile>
    }

    public struct OfferRegistry has key {
        id: UID,
        user_offers: Table<address, vector<ID>>
    }

    public struct EscrowRegistry has key {
        id: UID,
        user_escrows: Table<address, vector<ID>>,
    }

    public struct Deployer has key, store {
        id: UID,
    }

    public struct UserProfile has store {
        name: String,
        contact: String,
        email: String,
        owner: address,
        joined_date: u64,
        total_trades: u64,
        disputes: u64,
        completed_trades: u64,
        average_settlement_time: u64,
    }

    public struct Escrow has key, store {
        id: UID,
        offer_id: ID,
        seller: address,
        buyer: address,
        locked_coin: Balance<SUI>,
        fiat_amount: u64,
        status: String, // "PENDING" // "DISPUTE" // "COMPLETED" // "CANCELLED"
        created_at: u64,
    }

    public struct Offer has key, store {
        id: UID,
        owner: address,
        currency_code: String,
        locked_amount: Balance<SUI>,
        active_escrows: u64,
        price: u64,
        payment_type: String,
    }

    // ======== EVENTS ========
    public struct EscrowCreated has copy, drop {
        escrow_id: ID,
        offer_id: ID,
        seller: address,
        buyer: address,
        locked_coin: u64,
        fiat_amount: u64,
        status: String, 
        created_at: u64,
    }

    public struct PaymentConfirmed has copy, drop {
        escrow_id: ID,
        confirmed_by: address,
    }

    public struct DisputeRaised has copy, drop {
        escrow_id: ID,
        seller: address,
        buyer: address,
    }

    public struct PaymentConfirmedDuringDispute has copy, drop {
        escrow_id: ID,
        seller: address,
    }

    // ======== Initialization ========
    fun init(ctx: &mut TxContext) {
        let profile_registry = ProfileRegistry {
            id: object::new(ctx),
            user_profiles: table::new<address, UserProfile>(ctx),
        };
        transfer::share_object(profile_registry);

        let offer_registry = OfferRegistry {
            id: object::new(ctx),
            user_offers: table::new<address, vector<ID>>(ctx),
        };
        transfer::share_object(offer_registry);

        let escrow_registry = EscrowRegistry {
            id: object::new(ctx),
            user_escrows: table::new<address, vector<ID>>(ctx),
        };
        transfer::share_object(escrow_registry);

        let deployer = Deployer { // AI which would be the owner
            id: object::new(ctx)
        };
        let publisher = tx_context::sender(ctx);
        transfer::transfer(deployer, publisher);
    }

    // ======== FUNCTIONS ========
    public entry fun create_user_profile(
        name: vector<u8>,
        contact: vector<u8>,
        email: vector<u8>,
        registry: &mut ProfileRegistry,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(!table::contains(&registry.user_profiles, sender), E_ALREADY_EXISTS);

        let user_profile = UserProfile {
            name: string::utf8(name),
            contact: string::utf8(contact),
            email: string::utf8(email),
            owner: sender,
            joined_date: tx_context::epoch_timestamp_ms(ctx),
            total_trades: 0,
            disputes: 0,
            completed_trades: 0,
            average_settlement_time: 0,
        };

        table::add(&mut registry.user_profiles, sender, user_profile);
    }

    public entry fun create_offer(
        currency_code: vector<u8>,
        price: u64,
        payment_type: vector<u8>,
        sui_coin: Coin<SUI>,
        offer_registry: &mut OfferRegistry,
        _: &ProfileRegistry,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let locked_balance = coin::into_balance(sui_coin);

        let offer = Offer {
            id: object::new(ctx),
            locked_amount: locked_balance,
            owner: sender,
            currency_code: string::utf8(currency_code),
            active_escrows: 0,
            price,
            payment_type: string::utf8(payment_type),
        };
        let offer_id = object::uid_to_inner(&offer.id);
        transfer::share_object(offer);

        if (!table::contains(&offer_registry.user_offers, sender)) {
            table::add(&mut offer_registry.user_offers, sender, vector::empty<ID>());
        };
        let user_offers = table::borrow_mut(&mut offer_registry.user_offers, sender);
        vector::push_back(user_offers, offer_id);
    }

    public entry fun create_escrow(
        sui_to_buy: u64,
        offer: &mut Offer,
        escrow_registry: &mut EscrowRegistry,
        profile_registry: &mut ProfileRegistry,
        ctx: &mut TxContext
    ) {
        let buyer = tx_context::sender(ctx);
        let total_sui = balance::value(&offer.locked_amount);
        let fiat_amount = offer.price * sui_to_buy;

        assert!(buyer != offer.owner, E_CANNOT_BUY_OWN_OFFER);
        assert!(table::contains(&profile_registry.user_profiles, buyer), E_NO_USER_PROFILE); 
        assert!(sui_to_buy > 0 && sui_to_buy <= total_sui, E_INVALID_AMOUNT);
        
        let escrow_sui = balance::split(&mut offer.locked_amount, sui_to_buy);
        offer.active_escrows = offer.active_escrows + 1;

        let escrow = Escrow {
            id: object::new(ctx),
            offer_id: object::uid_to_inner(&offer.id),
            seller: offer.owner,
            buyer,
            locked_coin: escrow_sui,
            fiat_amount,
            status: string::utf8(b"PENDING"),
            created_at: tx_context::epoch_timestamp_ms(ctx),
        };

        let buyer_profile = table::borrow_mut(&mut profile_registry.user_profiles, buyer);
        buyer_profile.total_trades = buyer_profile.total_trades + 1;

        let seller_profile = table::borrow_mut(&mut profile_registry.user_profiles, offer.owner);
        seller_profile.total_trades = seller_profile.total_trades + 1;

        let escrow_id = object::uid_to_inner(&escrow.id);

        // Add to buyer's escrows
        if (!table::contains(&escrow_registry.user_escrows, buyer)) {
            table::add(&mut escrow_registry.user_escrows, buyer, vector::empty<ID>());
        };
        let buyer_escrows = table::borrow_mut(&mut escrow_registry.user_escrows, buyer);
        vector::push_back(buyer_escrows, escrow_id);

        // Add to seller's escrows
        if (!table::contains(&escrow_registry.user_escrows, offer.owner)) {
            table::add(&mut escrow_registry.user_escrows, offer.owner, vector::empty<ID>());
        };
        let seller_escrows = table::borrow_mut(&mut escrow_registry.user_escrows, offer.owner);
        vector::push_back(seller_escrows, escrow_id);

        event::emit(EscrowCreated {
            escrow_id,
            offer_id: object::uid_to_inner(&offer.id),
            seller: offer.owner,
            buyer,
            locked_coin: balance::value(&escrow.locked_coin),
            fiat_amount,
            status: string::utf8(b"PENDING"),
            created_at: tx_context::epoch_timestamp_ms(ctx),
        });

        transfer::share_object(escrow);
    }

    public entry fun confirm_payment(
        user_profile: &mut ProfileRegistry,
        escrow: &mut Escrow,
        offer: &mut Offer,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(escrow.seller == sender, E_NOT_SELLER);
        assert!(escrow.status == string::utf8(b"PENDING"), E_INVALID_STATE);
        assert!(object::uid_to_inner(&offer.id) == escrow.offer_id, E_INVALID_OFFER);

        let user_registry = table::borrow_mut(&mut user_profile.user_profiles, sender);
        assert!(user_registry.owner == sender, E_NOT_OWNER);

        let total = balance::value(&escrow.locked_coin);
        let payout_balance = balance::split(&mut escrow.locked_coin, total);
        let payout_coin = coin::from_balance(payout_balance, ctx);

        transfer::public_transfer(payout_coin, escrow.buyer);

        escrow.status = string::utf8(b"COMPLETED");
        offer.active_escrows = offer.active_escrows - 1;

        user_registry.completed_trades = user_registry.completed_trades + 1;
        let settlement_time = tx_context::epoch_timestamp_ms(ctx) - escrow.created_at;
        let total_time = user_registry.average_settlement_time * (user_registry.completed_trades - 1);
        user_registry.average_settlement_time =
            (total_time + settlement_time) / user_registry.completed_trades;

        event::emit(PaymentConfirmed {
            escrow_id: object::uid_to_inner(&escrow.id),
            confirmed_by: sender,
        });
    }

    public entry fun cancel_escrow(
        escrow: &mut Escrow,
        offer: &mut Offer,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert!(escrow.buyer == sender, E_NOT_BUYER);
        assert!(escrow.status == string::utf8(b"PENDING"), E_INVALID_STATE);
        assert!(object::uid_to_inner(&offer.id) == escrow.offer_id, E_INVALID_OFFER);

        let total = balance::value(&escrow.locked_coin);
        let to_return = balance::split(&mut escrow.locked_coin, total);
        balance::join(&mut offer.locked_amount, to_return);

        escrow.status = string::utf8(b"CANCELLED");
        offer.active_escrows = offer.active_escrows - 1;
    }

    public entry fun delete_offer(
        offer: Offer,
        offer_registry: &mut OfferRegistry,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert!(offer.owner == sender, E_NOT_OWNER);
        assert!(offer.active_escrows == 0, E_INVALID_STATE);

        let offer_id = object::uid_to_inner(&offer.id);

        if (table::contains(&offer_registry.user_offers, sender)) {
            let user_offers = table::borrow_mut(&mut offer_registry.user_offers, sender);
            let len = vector::length(user_offers);
            let mut i = 0;
            while (i < len) {
                if (*vector::borrow(user_offers, i) == offer_id) {
                    vector::remove(user_offers, i);
                    break;
                };
                i = i + 1;
            };
        };

        let Offer { id, locked_amount, owner: _, currency_code: _, active_escrows: _, price: _, payment_type: _ } = offer;

        if (balance::value(&locked_amount) > 0) {
            let coin_to_return = coin::from_balance(locked_amount, ctx);
            transfer::public_transfer(coin_to_return, sender);
        } else {
            balance::destroy_zero(locked_amount);
        };

        object::delete(id);
    }

    public entry fun make_dispute(
        escrow: &mut Escrow,
        user_profile: &mut ProfileRegistry,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        let user_registry = table::borrow_mut(&mut user_profile.user_profiles, sender);
        assert!(user_registry.owner == sender, E_NOT_OWNER);
        assert!(escrow.status == string::utf8(b"PENDING"), E_INVALID_STATE);

        escrow.status = string::utf8(b"DISPUTE");
        user_registry.disputes = user_registry.disputes + 1;

        event::emit(DisputeRaised {
            escrow_id: object::uid_to_inner(&escrow.id),
            seller: escrow.seller,
            buyer: escrow.buyer,
        });
    }

    public entry fun force_complete_trade(
        _: &Deployer,
        escrow: &mut Escrow,
        offer: &mut Offer,
        profile_registry: &mut ProfileRegistry,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(escrow.status == string::utf8(b"DISPUTE"), E_INVALID_STATE);
        assert!(object::uid_to_inner(&offer.id) == escrow.offer_id, E_INVALID_OFFER);

        let total = balance::value(&escrow.locked_coin);
        let payout_balance = balance::split(&mut escrow.locked_coin, total);
        let payout_coin = coin::from_balance(payout_balance, ctx);

        transfer::public_transfer(payout_coin, escrow.buyer);

        escrow.status = string::utf8(b"COMPLETED");
        offer.active_escrows = offer.active_escrows - 1;

        let seller_profile = table::borrow_mut(&mut profile_registry.user_profiles, escrow.seller);
        seller_profile.completed_trades = seller_profile.completed_trades + 1;
        let settlement_time = tx_context::epoch_timestamp_ms(ctx) - escrow.created_at;
        let total_time = seller_profile.average_settlement_time * (seller_profile.completed_trades - 1);
        seller_profile.average_settlement_time = (total_time + settlement_time) / seller_profile.completed_trades;

    }

    public entry fun refund_seller(
        _: &Deployer,
        escrow: &mut Escrow,
        offer: &mut Offer,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(escrow.status == string::utf8(b"DISPUTE"), E_INVALID_STATE);
        assert!(object::uid_to_inner(&offer.id) == escrow.offer_id, E_INVALID_OFFER);

        let total = balance::value(&escrow.locked_coin);
        let to_return = balance::split(&mut escrow.locked_coin, total);
        balance::join(&mut offer.locked_amount, to_return);

        escrow.status = string::utf8(b"CANCELLED");
        offer.active_escrows = offer.active_escrows - 1;
    }

    public entry fun resolve_dispute(escrow: &mut Escrow, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);

        assert!(escrow.seller == sender, E_NOT_SELLER);
        assert!(escrow.status == string::utf8(b"DISPUTE"), E_INVALID_STATE);

        event::emit(PaymentConfirmedDuringDispute {
            escrow_id: object::uid_to_inner(&escrow.id),
            seller: sender,
        });
    }

    // ======== GETTER FUNCTIONS ========
    public fun get_offer_price(self: &Offer): u64 {
        self.price
    }
    
    // ======== TEST ONLY FUNCTIONS ========
    #[test_only]
    public fun is_user_profiles_empty(registry: &ProfileRegistry): bool {
        table::is_empty(&registry.user_profiles)
    }

    #[test_only]
    public fun is_user_offers_empty(registry: &OfferRegistry): bool {
        table::is_empty(&registry.user_offers)
    }

    #[test_only]
    public fun is_user_escrows_empty(registry: &EscrowRegistry): bool {
        table::is_empty(&registry.user_escrows)
    }

    #[test_only]
    public fun is_user_offers_empty_for_address(registry: &OfferRegistry, user: address ): bool {
        !table::contains(&registry.user_offers, user) || 
        vector::is_empty(table::borrow(&registry.user_offers, user))
    }

    #[test_only]
    public fun get_user_profile_details(registry: &ProfileRegistry, user: address): (
        String, String, String, address, u64, u64, u64, u64, u64
    ) {
        let profile = table::borrow(&registry.user_profiles, user);
        (
            profile.name,
            profile.contact,
            profile.email,
            profile.owner,
            profile.joined_date,
            profile.total_trades,
            profile.disputes,
            profile.completed_trades,
            profile.average_settlement_time
        )
    }

    #[test_only]
    public fun get_offer_details(offer: &Offer): (&UID, address, &String, &Balance<SUI>, u64, u64, &String) {
        (
            &offer.id,
            offer.owner,
            &offer.currency_code,
            &offer.locked_amount,
            offer.active_escrows,
            offer.price,
            &offer.payment_type,
        )
    }


    #[test_only]
    public fun get_escrow_details(escrow: &Escrow): (&UID, &ID, &address, &address, &Balance<SUI>, &u64, &String, &u64 ) {
        (
            &escrow.id,
            &escrow.offer_id,
            &escrow.seller,
            &escrow.buyer,
            &escrow.locked_coin,
            &escrow.fiat_amount,
            &escrow.status,
            &escrow.created_at
        )
       
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    } 
}

