#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, vec, String, Env, Address};

#[contract]
pub struct CoinFlip;

#[derive(Clone)]
#[contracttype]
pub enum DataKeys{
    Admin,
    NativeCoinAddress,
    FlipCount,
    CoinFlipResult(Address)
}

#[contractimpl]
impl CoinFlip {
    pub fn initialize(env:Env, admin:Address) {
        if Self::has_administrator(env.clone()) {
            panic!("Contract already initialized.")
        }
        let key = DataKeys::Admin;
        env.storage().instance().set(&key, &admin)
    }

    pub fn set_native_coin(env:Env, address:Address) {
        let admin = Self::get_native_coin(env.clone());
        admin.require_auth();
        
        let key = DataKeys::NativeCoinAddress;
        env.storage().instance().set(&key, &address)
    }

    pub fn flip(env:Env, sender:Address, amount:i128) -> (String, String, bool) {
        sender.require_auth();
        // transfer native coin to current contract from 'sender' address
        let native_coin_addr = Self::get_native_coin(env.clone());
        let flip_key = DataKeys::FlipCount;
        let flip_count: u32 = env.storage().instance().get::<DataKeys, u32>(&flip_key).unwrap_or(0);

        let native_coin_client = token::Client::new(&env, &native_coin_addr);
        native_coin_client.transfer(&sender, &env.current_contract_address(), &amount);

        let value = vec![
            &env, 
            String::from_slice(&env, "tail"),
            String::from_slice(&env, "head"),
             ];

        let random_side = value.shuffle();

        let result = random_side.first_unchecked();
        let mut win_status = false;
        let flip_choice = String::from_slice(&env, "tail");
        if result == flip_choice {
            native_coin_client.transfer(&env.current_contract_address(), &sender, &(2 * amount));
            win_status = true;
            env.events().publish((sender.clone(), flip_choice.clone()), "You Won");
        }

        env.events().publish((sender, flip_choice.clone()), "You Lost");
        // increase flip counter 
        env.storage().instance().set(&flip_key, &(flip_count + 1));
        
        (flip_choice, result, win_status)
    }

    pub fn get_native_coin(env:Env) -> Address {
        let key = DataKeys::NativeCoinAddress;
        if let Some(native_coin_addr) = env.storage().instance().get::<DataKeys, Address>(&key) {
            native_coin_addr
        } else {
            panic!("Address not set.")
        }
    }

    pub fn has_administrator(env:Env) -> bool {
        let key = DataKeys::Admin;
        env.storage().instance().has(&key)
    }
}

// soroban contract deploy \
//   --wasm target/wasm32-unknown-unknown/release/coin_flip.wasm \
//   --source alice \
//   --network testnet

// soroban contract invoke \
// --id CB5J7DZCJZRD7R7YJEEWYA3TG4NIZEHWADVLH6QT3VXBJ3WVYHTMH2XJ \
// --source alice \
// --network testnet \
// -- \
// flip \
// --sender alice \
// --flip_choice "head" \
// --amount 10

// ["tail","head"]
// ["tail","head"]
// ["tail","head"]
// ["head","tail"]
// ["tail","head"]
// ["head","tail"]
// ["tail","head"]
// ["head","tail"]
// ["tail","head"]
// ["tail","head"]
// ["tail","head"]
// ["tail","head"]

//   ["head","tail","tail","head","head","tail"]
//   ["tail","head","head","head","tail","tail"]
//   ["tail","tail","head","head","head","tail"]