#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, vec, String, Env, Address};
mod test;

#[contract]
pub struct CoinFlip;

#[derive(Clone)]
#[contracttype]
pub enum DataKeys{
    Admin,
    NativeCoinAddress,
    FlipCount,
    ContractBalance
}

/// Returns the boolean status of contract initialization.
/// 
/// Returns `false` if contract not initialized
fn has_administrator(env:Env) -> bool {
    let key = DataKeys::Admin;
    env.storage().instance().has(&key)
}

/// Returns the admin address set in the contract.
///
/// # Panics
///
/// If the contract has not yet been initialized.
fn get_admin(env:Env) -> Address {
    let key = DataKeys::Admin;
    if let Some(admin) = env.storage().instance().get::<DataKeys, Address>(&key) {
        admin
    } else {
        panic!("Admin not set.")
    }
}

/// Returns the native coin address set in the contract.
///
/// # Panics
///
/// If the contract has not yet been initialized.
fn get_native_coin(env:Env) -> Address {
    let key = DataKeys::NativeCoinAddress;
    if let Some(native_coin_addr) = env.storage().instance().get::<DataKeys, Address>(&key) {
        native_coin_addr
    } else {
        panic!("Address not set.")
    }
}

/// Returns the native coin balance of the contract.
/// 
fn get_balance_of_contract(env:Env) -> i128 {
    let native_coin_addr = get_native_coin(env.clone());
    let native_coin_client = token::Client::new(&env, &native_coin_addr);
    native_coin_client.balance(&env.current_contract_address())
}

#[contractimpl]
impl CoinFlip {
    /// Initialize contract with `super admin`.
    ///
    /// # Arguments
    ///
    /// * `admin` - The address controlling contract and its funds.
    /// * `native_coin_address` - The address of token used in the app.
    /// * `amount` - The amount of tokens reserve hold.    
    pub fn initialize(env:Env, admin:Address, native_coin_address:Address, amount:i128) {
        admin.require_auth();

        if has_administrator(env.clone()) {
            panic!("Contract already initialized.")
        }
        let key = DataKeys::Admin;
        env.storage().instance().set(&key, &admin);

        let coin_key = DataKeys::NativeCoinAddress;
        env.storage().instance().set(&coin_key, &native_coin_address);

        // let native_coin_client = token::Client::new(&env, &native_coin_address);
        token::Client::new(&env, &native_coin_address).transfer(&admin, &env.current_contract_address(), &amount);

        let balance_key = DataKeys::ContractBalance;
        env.storage().instance().set(&balance_key, &amount);

    }

    /// Flip the coin by `sender` for `amount` with `flip_choice`.
    ///
    /// # Arguments
    ///
    /// * `sender` - The address calling the flip function.
    /// * `flip_choice` - The string of choices either `head` or `tail`.
    /// * `amount` - The amount of tokens to bet.
    ///
    /// # Events
    ///
    /// Emits an event with topics `[sender, flip_choice, amount], 
    /// data=["You Won"] or data=["You Lost"]`
    pub fn flip(env:Env, sender:Address, flip_choice:String, amount:i128) ->  bool {
        sender.require_auth();

        if !(flip_choice == String::from_str(&env, "head") || flip_choice == String::from_str(&env, "tail")) {
            panic!("Wrong flip choice. Please re-check your input.")
        }

        let contract_balance = get_balance_of_contract(env.clone());
        if contract_balance < (amount * 2) {
            panic!("Not enough balance in contract. Plese flip for lesser amount.")
        }

        // transfer native coin to current contract from 'sender' address
        let native_coin_addr = get_native_coin(env.clone());
        let flip_key = DataKeys::FlipCount;
        let flip_count: u32 = env.storage().instance().get::<DataKeys, u32>(&flip_key).unwrap_or(0);

        let native_coin_client = token::Client::new(&env, &native_coin_addr);
        native_coin_client.transfer(&sender, &env.current_contract_address(), &(amount));

        let balance_key = DataKeys::ContractBalance;
        env.storage().instance().set(&balance_key, &(contract_balance + amount));

        let value = vec![
            &env, 
            String::from_str(&env, "tail"),
            String::from_str(&env, "head"),
             ];

        let random_side = value.to_shuffled();
        let result = random_side.first_unchecked();
        let mut win_status = false;

        if result == flip_choice {
            native_coin_client.transfer(&env.current_contract_address(), &sender, &(2 * amount));
            win_status = true;
            env.events().publish((sender.clone(), flip_choice.clone(), amount), "You Won");
            env.storage().instance().set(&balance_key, &(contract_balance - amount));
        } else {
            env.events().publish((sender, flip_choice.clone(), amount), "You Lost");
        }

        // increase flip counter 
        env.storage().instance().set(&flip_key, &(flip_count + 1));

        win_status
    }

    pub fn balance(env:Env) -> i128 {
        get_balance_of_contract(env)
    }

    pub fn native_coin(env:Env) -> Address {
        get_native_coin(env)
    }

    pub fn admin(env:Env) -> Address {
        get_admin(env)
    }
}

soroban contract invoke \
  --id CDZATF3FFNKCGH5L7U75JKWRWDK2YWJ3ZDOMOH4NHGDIPHN67QMMKFH3 \
  --source alice \
  --network testnet \
  -- \
  initialize \
  --admin alice \
  --native_coin_address CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC \
  --amount 1000000000