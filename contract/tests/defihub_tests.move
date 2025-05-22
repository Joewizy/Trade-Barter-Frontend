#[test_only]
module defihub::escrow_test {
    use defihub::Escrow;
    use std::debug;
    use sui::balance::{Self, Balance};
    use std::string::{Self, String};
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::test_scenario;
    use sui::test_utils;
    use sui::clock::{Self, Clock};
    use defihub::Escrow::E_CANNOT_BUY_OWN_OFFER;

    #[test]
    fun test_all_shared_objects_are_created() {
        let owner = @0xCA;

        let mut scenario = test_scenario::begin(owner);

        scenario.next_tx(owner);
        {   
            Escrow::init_for_testing(scenario.ctx());
        };

        scenario.next_tx(owner);
        {
            let profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let escrow_registry = scenario.take_shared<Escrow::EscrowRegistry>();
            let office_registry = scenario.take_shared<Escrow::OfferRegistry>();

            assert!(Escrow::is_user_profiles_empty(&profile_registry), 0);
            assert!(Escrow::is_user_escrows_empty(&escrow_registry), 0);
            assert!(Escrow::is_user_offers_empty(&office_registry), 0);

            test_scenario::return_shared(profile_registry);
            test_scenario::return_shared(office_registry);
            test_scenario::return_shared(escrow_registry);
        };
        scenario.end();
    }
    
    #[test]
    fun test_create_user_profile() {
        let owner = @0xCA;
        let user = @0x12;

        let mut scenario = test_scenario::begin(owner);

        scenario.next_tx(owner);
        {   
            Escrow::init_for_testing(scenario.ctx());
        };

        scenario.next_tx(user);
        {
            let name: vector<u8> = b"Joe";
            let contact: vector<u8> = b"12345";
            let email: vector<u8> = b"test@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            
            let (name, contact, email, owner, joined_date, total_trades, disputes, completed_trades, average_settlement_time) =
                Escrow::get_user_profile_details(&profile_registry, user);

            assert!(name == name);
            assert!(contact == contact);
            assert!(email == email);
            assert!(owner == user);
            assert!(total_trades == 0);
            assert!(disputes == 0);
            assert!(completed_trades == 0);
            assert!(average_settlement_time == 0);
            assert!(joined_date == 0);

            test_scenario::return_shared(profile_registry);
        };

        scenario.end();
    }

    #[test]
    fun test_create_offer_and_escrow() {
        let owner = @0xCA;
        let seller = @0x13;
        let buyer = @0x14;

        let mut scenario = test_scenario::begin(owner);

        scenario.next_tx(owner);
        {   
            Escrow::init_for_testing(scenario.ctx());
        };

        // Buyer profile [UserProfile]
        scenario.next_tx(buyer);
        {
            let name: vector<u8> = b"Palmer";
            let contact: vector<u8> = b"36978";
            let email: vector<u8> = b"Palmer@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {
            let name: vector<u8> = b"Joe";
            let contact: vector<u8> = b"12345";
            let email: vector<u8> = b"test@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {   
            let mut coin = coin::mint_for_testing<SUI>(1000, scenario.ctx());
            let price = 1000;
            let currency_code: vector<u8> = b"Joe";
            let payment_type: vector<u8> = b"BankTransfer";

            let profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut offer_registry = scenario.take_shared<Escrow::OfferRegistry>();

            Escrow::create_offer(currency_code, price, payment_type, coin, &mut offer_registry, &profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
            test_scenario::return_shared(offer_registry);
        };

        scenario.next_tx(buyer);
        {
            let mut offer = scenario.take_shared<Escrow::Offer>();
            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut escrow_registry = scenario.take_shared<Escrow::EscrowRegistry>();

            let sui_to_buy = 100;
            Escrow::create_escrow(sui_to_buy, &mut offer, &mut escrow_registry, &mut profile_registry, scenario.ctx());

            // Test the Offer the Seller created above
            let (id, owner, currency_code, locked_amount, active_escrows, price, payment_type) = offer.get_offer_details();
            let mut coin = coin::mint_for_testing<SUI>(900, scenario.ctx()); // 100 sui has been deducted from the escrow created
            let locked_coin = coin::into_balance(coin);

            assert!(owner == seller);
            assert!(currency_code == string::utf8(b"Joe"));
            assert!(locked_amount == locked_coin);
            assert!(active_escrows == 1);
            assert!(price == 1000);
            assert!(payment_type == string::utf8(b"BankTransfer"));

            test_scenario::return_shared(offer);
            test_scenario::return_shared(escrow_registry);
            test_scenario::return_shared(profile_registry);
            test_utils::destroy(locked_coin);
        };

        scenario.next_tx(buyer);
        {
            let mut offer = scenario.take_shared<Escrow::Offer>();
            let (id, _, _, _, _, _, _) = offer.get_offer_details();
            let time = scenario.ctx().epoch_timestamp_ms();

            // Test the Escrow the buyer created 
            let expected_locked_escrow_balance = balance::create_for_testing(100);
            let escrow = scenario.take_shared<Escrow::Escrow>();
            let (escrow_id, offer_id, escrow_seller, escrow_buyer, escrow_locked_coin, fiat_amount, status, time_created) = escrow.get_escrow_details();
  
            assert!(seller == escrow_seller);
            assert!(buyer == escrow_buyer);
            assert!(object::uid_as_inner(id) == offer_id);
            assert!(expected_locked_escrow_balance == escrow_locked_coin);
            assert!(100 * 1000 == fiat_amount);
            assert!(string::utf8(b"PENDING") == status);
            assert!(time_created == time);

            test_scenario::return_shared(offer);
            test_scenario::return_shared(escrow);
            test_utils::destroy(expected_locked_escrow_balance);
        };
        scenario.end();
    }

    #[test]
    fun test_confirm_paymennt() {
        let owner = @0xCA;
        let seller = @0x13;
        let buyer = @0x14;

        let mut scenario = test_scenario::begin(owner);

        scenario.next_tx(owner);
        {   
            Escrow::init_for_testing(scenario.ctx());
        };

        scenario.next_tx(buyer);
        {
            let name: vector<u8> = b"Palmer";
            let contact: vector<u8> = b"36978";
            let email: vector<u8> = b"Palmer@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {
            let name: vector<u8> = b"Joe";
            let contact: vector<u8> = b"12345";
            let email: vector<u8> = b"test@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {   
            let mut coin = coin::mint_for_testing<SUI>(1000, scenario.ctx());
            let price = 1000;
            let currency_code: vector<u8> = b"Joe";
            let payment_type: vector<u8> = b"BankTransfer";

            let profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut offer_registry = scenario.take_shared<Escrow::OfferRegistry>();

            Escrow::create_offer(currency_code, price, payment_type, coin, &mut offer_registry, &profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
            test_scenario::return_shared(offer_registry);
        };

        scenario.next_tx(buyer);
        {
            let mut offer = scenario.take_shared<Escrow::Offer>();
            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut escrow_registry = scenario.take_shared<Escrow::EscrowRegistry>();

            let sui_to_buy = 100;
            Escrow::create_escrow(sui_to_buy, &mut offer, &mut escrow_registry, &mut profile_registry, scenario.ctx());

            test_scenario::return_shared(offer);
            test_scenario::return_shared(escrow_registry);
            test_scenario::return_shared(profile_registry);
        };
        
        // Confirm payment and release funds to the seller
        scenario.next_tx(seller);
        {
            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut offer = scenario.take_shared<Escrow::Offer>();
            let mut escrow = scenario.take_shared<Escrow::Escrow>();

            Escrow::confirm_payment(&mut profile_registry, &mut escrow, &mut offer, scenario.ctx());

            let (_, _, _, _, active_escrows, _, _) = offer.get_offer_details();
            let (_, _, _, _, _, _, escrow_status, escrow_created_at,) = escrow.get_escrow_details();
            let (_, _, _, _, _, total_trades, _, completed_trades, average_settlement_time) = profile_registry.get_user_profile_details(seller);
            
            let setttlement_time = scenario.ctx().epoch_timestamp_ms() - *escrow_created_at;
            let total_time = average_settlement_time * (completed_trades - 1);
            let avg_time = (total_time + setttlement_time) / completed_trades;

            assert!(active_escrows == 0);
            assert!(escrow_status == string::utf8(b"COMPLETED"));
            assert!(total_trades == 1);
            assert!(completed_trades == 1);
            assert!(avg_time == average_settlement_time);

            test_scenario::return_shared(offer);
            test_scenario::return_shared(escrow);
            test_scenario::return_shared(profile_registry);
        };
        scenario.end();
    }

    #[test]
    fun test_cancel_escrow() {
        let owner = @0xCA;
        let seller = @0x13;
        let buyer = @0x14;

        let mut scenario = test_scenario::begin(owner);

        scenario.next_tx(owner);
        {   
            Escrow::init_for_testing(scenario.ctx());
        };

        scenario.next_tx(buyer);
        {
            let name: vector<u8> = b"Palmer";
            let contact: vector<u8> = b"36978";
            let email: vector<u8> = b"Palmer@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {
            let name: vector<u8> = b"Joe";
            let contact: vector<u8> = b"12345";
            let email: vector<u8> = b"test@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {   
            let mut coin = coin::mint_for_testing<SUI>(1000, scenario.ctx());
            let price = 1000;
            let currency_code: vector<u8> = b"Joe";
            let payment_type: vector<u8> = b"BankTransfer";

            let profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut offer_registry = scenario.take_shared<Escrow::OfferRegistry>();

            Escrow::create_offer(currency_code, price, payment_type, coin, &mut offer_registry, &profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
            test_scenario::return_shared(offer_registry);
        };

        scenario.next_tx(buyer);
        {
            let mut offer = scenario.take_shared<Escrow::Offer>();
            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut escrow_registry = scenario.take_shared<Escrow::EscrowRegistry>();

            let sui_to_buy = 100;
            Escrow::create_escrow(sui_to_buy, &mut offer, &mut escrow_registry, &mut profile_registry, scenario.ctx());

            test_scenario::return_shared(offer);
            test_scenario::return_shared(escrow_registry);
            test_scenario::return_shared(profile_registry);
        };
        
        // Cancel Escrow
        scenario.next_tx(buyer);
        {
            let mut offer = scenario.take_shared<Escrow::Offer>();
            let mut escrow = scenario.take_shared<Escrow::Escrow>();

            Escrow::cancel_escrow(&mut escrow, &mut offer, scenario.ctx());

            let (_, _, _, _, active_escrows, _, _) = offer.get_offer_details();
            let (_, _, _, _, escrow_locked_balance, _, escrow_status, _,) = escrow.get_escrow_details();
            let expected_locked_escrow_balance = balance::create_for_testing(0);
            
            assert!(active_escrows == 0);
            assert!(escrow_status == string::utf8(b"CANCELLED"));
            assert!(escrow_locked_balance == expected_locked_escrow_balance);

            test_scenario::return_shared(offer);
            test_scenario::return_shared(escrow);
            test_utils::destroy(expected_locked_escrow_balance);
        };
        scenario.end();
    }

    #[test]
    fun test_delete_offer() {
        let owner = @0xCA;
        let seller = @0x13;
        let buyer = @0x14;

        let mut scenario = test_scenario::begin(owner);

        scenario.next_tx(owner);
        {   
            Escrow::init_for_testing(scenario.ctx());
        };

        scenario.next_tx(buyer);
        {
            let name: vector<u8> = b"Palmer";
            let contact: vector<u8> = b"36978";
            let email: vector<u8> = b"Palmer@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {
            let name: vector<u8> = b"Joe";
            let contact: vector<u8> = b"12345";
            let email: vector<u8> = b"test@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {   
            let mut coin = coin::mint_for_testing<SUI>(1000, scenario.ctx());
            let price = 1000;
            let currency_code: vector<u8> = b"Joe";
            let payment_type: vector<u8> = b"BankTransfer";

            let profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut offer_registry = scenario.take_shared<Escrow::OfferRegistry>();

            Escrow::create_offer(currency_code, price, payment_type, coin, &mut offer_registry, &profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
            test_scenario::return_shared(offer_registry);
        };

        scenario.next_tx(seller);
        {
            let offer = scenario.take_shared<Escrow::Offer>();
            let mut offer_registry = scenario.take_shared<Escrow::OfferRegistry>();

            Escrow::delete_offer(offer, &mut offer_registry, scenario.ctx());

            assert!(Escrow::is_user_offers_empty_for_address(&offer_registry, seller));

            test_scenario::return_shared(offer_registry);
        };
        scenario.end();
    }

    #[test]
    fun test_make_and_resolve_dispute() {
        let owner = @0xCA;
        let seller = @0x13;
        let buyer = @0x14;

        let mut scenario = test_scenario::begin(owner);

        scenario.next_tx(owner);
        {   
            Escrow::init_for_testing(scenario.ctx());
        };


        scenario.next_tx(buyer);
        {
            let name: vector<u8> = b"Palmer";
            let contact: vector<u8> = b"36978";
            let email: vector<u8> = b"Palmer@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {
            let name: vector<u8> = b"Joe";
            let contact: vector<u8> = b"12345";
            let email: vector<u8> = b"test@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {   
            let mut coin = coin::mint_for_testing<SUI>(1000, scenario.ctx());
            let price = 1000;
            let currency_code: vector<u8> = b"Joe";
            let payment_type: vector<u8> = b"BankTransfer";

            let profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut offer_registry = scenario.take_shared<Escrow::OfferRegistry>();

            Escrow::create_offer(currency_code, price, payment_type, coin, &mut offer_registry, &profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
            test_scenario::return_shared(offer_registry);
        };

        scenario.next_tx(buyer);
        {
            let mut offer = scenario.take_shared<Escrow::Offer>();
            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut escrow_registry = scenario.take_shared<Escrow::EscrowRegistry>();

            let sui_to_buy = 100;
            Escrow::create_escrow(sui_to_buy, &mut offer, &mut escrow_registry, &mut profile_registry, scenario.ctx());

            test_scenario::return_shared(offer);
            test_scenario::return_shared(escrow_registry);
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(buyer);
        {
            let mut escrow = scenario.take_shared<Escrow::Escrow>();
            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::make_dispute(&mut escrow, &mut profile_registry, scenario.ctx());

            let (_, _, _, _, _, _, escrow_status, escrow_created_at,) = escrow.get_escrow_details();
            let (_, _, _, _, _, _, disputes, _, _) = profile_registry.get_user_profile_details(buyer);

            assert!(escrow_status == string::utf8(b"DISPUTE"));
            assert!(disputes == 1);

            test_scenario::return_shared(escrow);
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {
            let mut escrow = scenario.take_shared<Escrow::Escrow>();
            Escrow::resolve_dispute(&mut escrow, scenario.ctx()); // trigger an event to the AI
            test_scenario::return_shared(escrow);
        };
        scenario.end();
    }

    #[test]
    fun test_deployer_refunds_seller() {
        let owner = @0xCA;
        let seller = @0x13;
        let buyer = @0x14;

        let mut scenario = test_scenario::begin(owner);

        scenario.next_tx(owner);
        {   
            Escrow::init_for_testing(scenario.ctx());
        };


        scenario.next_tx(buyer);
        {
            let name: vector<u8> = b"Palmer";
            let contact: vector<u8> = b"36978";
            let email: vector<u8> = b"Palmer@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {
            let name: vector<u8> = b"Joe";
            let contact: vector<u8> = b"12345";
            let email: vector<u8> = b"test@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {   
            let mut coin = coin::mint_for_testing<SUI>(1000, scenario.ctx());
            let price = 1000;
            let currency_code: vector<u8> = b"Joe";
            let payment_type: vector<u8> = b"BankTransfer";

            let profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut offer_registry = scenario.take_shared<Escrow::OfferRegistry>();

            Escrow::create_offer(currency_code, price, payment_type, coin, &mut offer_registry, &profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
            test_scenario::return_shared(offer_registry);
        };

        scenario.next_tx(buyer);
        {
            let mut offer = scenario.take_shared<Escrow::Offer>();
            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut escrow_registry = scenario.take_shared<Escrow::EscrowRegistry>();

            let sui_to_buy = 100;
            Escrow::create_escrow(sui_to_buy, &mut offer, &mut escrow_registry, &mut profile_registry, scenario.ctx());

            test_scenario::return_shared(offer);
            test_scenario::return_shared(escrow_registry);
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(buyer);
        {
            let mut escrow = scenario.take_shared<Escrow::Escrow>();
            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::make_dispute(&mut escrow, &mut profile_registry, scenario.ctx());

            let (_, _, _, _, _, _, escrow_status, escrow_created_at,) = escrow.get_escrow_details();
            let (_, _, _, _, _, _, disputes, _, _) = profile_registry.get_user_profile_details(buyer);

            assert!(escrow_status == string::utf8(b"DISPUTE"));
            assert!(disputes == 1);

            test_scenario::return_shared(escrow);
            test_scenario::return_shared(profile_registry);
        };

        // Deployer refunds the seller back his funds
        scenario.next_tx(owner);
        {
            let deployer = scenario.take_from_sender<Escrow::Deployer>();

            let mut offer = scenario.take_shared<Escrow::Offer>();
            let mut escrow = scenario.take_shared<Escrow::Escrow>();

            Escrow::refund_seller(&deployer, &mut escrow, &mut offer, scenario.ctx());

            let (_, _, _, offer_locked_amount, active_escrows, _, _) = offer.get_offer_details();
            let (_, _, _, _, _, _, escrow_status, _,) = escrow.get_escrow_details();
            let mut coin = coin::mint_for_testing<SUI>(1000, scenario.ctx());
            let locked_coin = coin::into_balance(coin);

            assert!(active_escrows == 0);
            assert!(offer_locked_amount == locked_coin);
            assert!(escrow_status == string::utf8(b"CANCELLED"));

            test_utils::destroy(locked_coin);
            test_scenario::return_shared(offer);
            test_scenario::return_shared(escrow);
            test_scenario::return_to_sender(&scenario, deployer);
        };
        scenario.end();
    }

    #[test]
    fun test_deployer_completes_trade() {
        let owner = @0xCA;
        let seller = @0x13;
        let buyer = @0x14;

        let mut scenario = test_scenario::begin(owner);

        scenario.next_tx(owner);
        {   
            Escrow::init_for_testing(scenario.ctx());
        };


        scenario.next_tx(buyer);
        {
            let name: vector<u8> = b"Palmer";
            let contact: vector<u8> = b"36978";
            let email: vector<u8> = b"Palmer@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {
            let name: vector<u8> = b"Joe";
            let contact: vector<u8> = b"12345";
            let email: vector<u8> = b"test@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {   
            let mut coin = coin::mint_for_testing<SUI>(1000, scenario.ctx());
            let price = 1000;
            let currency_code: vector<u8> = b"Joe";
            let payment_type: vector<u8> = b"BankTransfer";

            let profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut offer_registry = scenario.take_shared<Escrow::OfferRegistry>();

            Escrow::create_offer(currency_code, price, payment_type, coin, &mut offer_registry, &profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
            test_scenario::return_shared(offer_registry);
        };

        scenario.next_tx(buyer);
        {
            let mut offer = scenario.take_shared<Escrow::Offer>();
            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut escrow_registry = scenario.take_shared<Escrow::EscrowRegistry>();

            let sui_to_buy = 100;
            Escrow::create_escrow(sui_to_buy, &mut offer, &mut escrow_registry, &mut profile_registry, scenario.ctx());

            test_scenario::return_shared(offer);
            test_scenario::return_shared(escrow_registry);
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(buyer);
        {
            let mut escrow = scenario.take_shared<Escrow::Escrow>();
            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();

            Escrow::make_dispute(&mut escrow, &mut profile_registry, scenario.ctx());

            let (_, _, _, _, _, _, escrow_status, escrow_created_at,) = escrow.get_escrow_details();
            let (_, _, _, _, _, _, disputes, _, _) = profile_registry.get_user_profile_details(buyer);

            assert!(escrow_status == string::utf8(b"DISPUTE"));
            assert!(disputes == 1);

            test_scenario::return_shared(escrow);
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(seller);
        {
            let mut escrow = scenario.take_shared<Escrow::Escrow>();
            Escrow::resolve_dispute(&mut escrow, scenario.ctx()); // trigger an event to the AI
            test_scenario::return_shared(escrow);
        };

        // Deployer trigger force_complete_trade function
        scenario.next_tx(owner);
        {
            let deployer = scenario.take_from_sender<Escrow::Deployer>();

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut offer = scenario.take_shared<Escrow::Offer>();
            let mut escrow = scenario.take_shared<Escrow::Escrow>();

            Escrow::force_complete_trade(&deployer, &mut escrow, &mut offer, &mut profile_registry, scenario.ctx());

            let (_, _, _, _, active_escrows, _, _) = offer.get_offer_details();
            let (_, _, _, _, _, _, escrow_status, escrow_created_at,) = escrow.get_escrow_details();
            let (_, _, _, _, _, total_trades, _, completed_trades, average_settlement_time) = profile_registry.get_user_profile_details(seller);
            
            let setttlement_time = scenario.ctx().epoch_timestamp_ms() - *escrow_created_at;
            let total_time = average_settlement_time * (completed_trades - 1);
            let avg_time = (total_time + setttlement_time) / completed_trades;

            assert!(active_escrows == 0);
            assert!(escrow_status == string::utf8(b"COMPLETED"));
            assert!(total_trades == 1);
            assert!(completed_trades == 1);
            assert!(avg_time == average_settlement_time);

            test_scenario::return_shared(offer);
            test_scenario::return_shared(escrow);
            test_scenario::return_shared(profile_registry);
            test_scenario::return_to_sender(&scenario, deployer);
        };
        scenario.end();
    }

    // ======== EXPECTED FAILED/REVERT TESTS ========
    #[test, expected_failure(abort_code = Escrow::E_ALREADY_EXISTS)]
    fun test_cannot_create_multiple_user_profile() {
        let owner = @0xCA;
        let user = @0x12;

        let mut scenario = test_scenario::begin(owner);

        scenario.next_tx(owner);
        {   
            Escrow::init_for_testing(scenario.ctx());
        };

        scenario.next_tx(user);
        {
            let name: vector<u8> = b"Joe";
            let contact: vector<u8> = b"12345";
            let email: vector<u8> = b"test@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(user);
        {
            let name: vector<u8> = b"Joe";
            let contact: vector<u8> = b"12345";
            let email: vector<u8> = b"test@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.end();
    }

    #[test, expected_failure(abort_code = Escrow::E_NO_USER_PROFILE)]
    fun test_cannot_create_escrow_without_user_profile() {
        let owner = @0xCA;
        let user = @0x12;

        let mut scenario = test_scenario::begin(owner);

        scenario.next_tx(owner);
        {   
            Escrow::init_for_testing(scenario.ctx());
        };

        scenario.next_tx(owner);
        {
            let name: vector<u8> = b"Joe";
            let contact: vector<u8> = b"12345";
            let email: vector<u8> = b"test@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };

        scenario.next_tx(owner);
        {
            let mut coin = coin::mint_for_testing<SUI>(1000, scenario.ctx());
            let price = 1000;
            let currency_code: vector<u8> = b"Joe";
            let payment_type: vector<u8> = b"BankTransfer";

            let profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut offer_registry = scenario.take_shared<Escrow::OfferRegistry>();

            Escrow::create_offer(currency_code, price, payment_type, coin, &mut offer_registry, &profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
            test_scenario::return_shared(offer_registry);
        };

        scenario.next_tx(user);
        {
            let mut offer = scenario.take_shared<Escrow::Offer>();
            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut escrow_registry = scenario.take_shared<Escrow::EscrowRegistry>();

            let sui_to_buy = 100;
            Escrow::create_escrow(sui_to_buy, &mut offer, &mut escrow_registry, &mut profile_registry, scenario.ctx());

            test_scenario::return_shared(offer);
            test_scenario::return_shared(escrow_registry);
            test_scenario::return_shared(profile_registry);
        };
        scenario.end();
    }

     #[test, expected_failure(abort_code = Escrow::E_CANNOT_BUY_OWN_OFFER)]
    fun test_cannot_buy_own_offer() {
        let owner = @0xCA;
        let user = @0x12;

        let mut scenario = test_scenario::begin(owner);

        scenario.next_tx(owner);
        {   
            Escrow::init_for_testing(scenario.ctx());
        };

        scenario.next_tx(user);
        {
            let name: vector<u8> = b"Joe";
            let contact: vector<u8> = b"12345";
            let email: vector<u8> = b"test@gmail.com";

            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            Escrow::create_user_profile(name, contact, email, &mut profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
        };
        // user creates an offer
        scenario.next_tx(user);
        {
            let mut coin = coin::mint_for_testing<SUI>(1000, scenario.ctx());
            let price = 1000;
            let currency_code: vector<u8> = b"Joe";
            let payment_type: vector<u8> = b"BankTransfer";

            let profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut offer_registry = scenario.take_shared<Escrow::OfferRegistry>();

            Escrow::create_offer(currency_code, price, payment_type, coin, &mut offer_registry, &profile_registry, scenario.ctx());
            test_scenario::return_shared(profile_registry);
            test_scenario::return_shared(offer_registry);
        };
        // user try to buy his offer
        scenario.next_tx(user);
        {
            let mut offer = scenario.take_shared<Escrow::Offer>();
            let mut profile_registry = scenario.take_shared<Escrow::ProfileRegistry>();
            let mut escrow_registry = scenario.take_shared<Escrow::EscrowRegistry>();

            let sui_to_buy = 100;
            Escrow::create_escrow(sui_to_buy, &mut offer, &mut escrow_registry, &mut profile_registry, scenario.ctx());

            test_scenario::return_shared(offer);
            test_scenario::return_shared(escrow_registry);
            test_scenario::return_shared(profile_registry);
        };
        scenario.end();
    }
}

