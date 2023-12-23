#![cfg(test)]
extern crate std;
use super::*;
use crate::{CoinFlip, CoinFlipClient};

use soroban_sdk::{testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation}, Symbol, Address, Env, IntoVal};

mod token_contract {
    soroban_sdk::contractimport!(
        file =
            "../coin_flip/src/token_contract.wasm"
    );
}

fn deploy_coin_flip<'a>(env: &Env) ->  CoinFlipClient<'a> {
    let contract_id = env.register_contract(None, CoinFlip);
    let client = CoinFlipClient::new(env, &contract_id);
    client
}

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let amount:i128 = 1000;

    let native_coin_address = env.register_contract_wasm(None, token_contract::WASM);
    let native_coin_client = token_contract::Client::new(&env, &native_coin_address);

    let coin_flip = deploy_coin_flip(&env);

    native_coin_client.initialize(&coin_flip.address, &7, &String::from_str(&env, "TEST"), &String::from_str(&env, "TST"));
    native_coin_client.mint(&admin, &amount);
    assert_eq!(native_coin_client.balance(&admin), amount);

    coin_flip.initialize(&admin, &native_coin_address, &amount);
    assert_eq!(
        env.auths(),
        [(
            admin.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    coin_flip.address.clone(),
                    Symbol::new(&env, "initialize"),
                    (
                        admin.clone(),
                        native_coin_address.clone(),
                        amount
                    )
                        .into_val(&env),
                )),
                sub_invocations: std::vec![AuthorizedInvocation {
                    function: AuthorizedFunction::Contract((
                        native_coin_address.clone(),
                        Symbol::new(&env, "transfer"),
                        (
                            admin.clone(),
                            &coin_flip.address,
                            amount
                        )
                            .into_val(&env),
                    )),
                    sub_invocations: std::vec![]
                }]
            }
        ),]
    );
    
    // assert contract details
    assert_eq!(coin_flip.admin(), admin);
    assert_eq!(coin_flip.native_coin(), native_coin_address);
    assert_eq!(coin_flip.balance(), amount);

}

#[test]
#[should_panic(expected = "Contract already initialized.")]
fn test_double_initialize() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let amount = 1000;

    let native_coin_address = env.register_contract_wasm(None, token_contract::WASM);
    let native_coin_client = token_contract::Client::new(&env, &native_coin_address);

    native_coin_client.initialize(&admin, &7, &String::from_str(&env, "TEST"), &String::from_str(&env, "TST"));
    native_coin_client.mint(&admin, &amount);

    let coin_flip = deploy_coin_flip(&env);
    coin_flip.initialize(&admin, &native_coin_address, &amount);
    coin_flip.initialize(&admin, &native_coin_address, &amount);

}

#[test]
fn test_coin_flip() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let flip_choice = String::from_str(&env, "head");
    let amount = 1000;


    let native_coin_address = env.register_contract_wasm(None, token_contract::WASM);
    let native_coin_client = token_contract::Client::new(&env, &native_coin_address);

    native_coin_client.initialize(&admin, &7, &String::from_str(&env, "TEST"), &String::from_str(&env, "TST"));
    native_coin_client.mint(&admin, &(amount*3));
    native_coin_client.mint(&sender, &amount);


    let coin_flip = deploy_coin_flip(&env);
    coin_flip.initialize(&admin, &native_coin_address, &(amount * 2));

    coin_flip.flip(&sender, &flip_choice, &amount);
}

#[test]
#[should_panic(expected = "Wrong flip choice. Please re-check your input.")]
fn test_wrong_choice_coin_flip() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let flip_choice = String::from_str(&env, "headss");
    let amount = 1000;


    let native_coin_address = env.register_contract_wasm(None, token_contract::WASM);
    let native_coin_client = token_contract::Client::new(&env, &native_coin_address);

    native_coin_client.initialize(&admin, &7, &String::from_str(&env, "TEST"), &String::from_str(&env, "TST"));
    native_coin_client.mint(&admin, &(amount*3));
    native_coin_client.mint(&sender, &amount);


    let coin_flip = deploy_coin_flip(&env);
    coin_flip.initialize(&admin, &native_coin_address, &(amount * 2));

    coin_flip.flip(&sender, &flip_choice, &amount);
}

#[test]
#[should_panic(expected = "Not enough balance in contract. Plese flip for lesser amount.")]
fn test_contract_insufficient_balance_coin_flip() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let flip_choice = String::from_str(&env, "head");
    let amount = 1000;


    let native_coin_address = env.register_contract_wasm(None, token_contract::WASM);
    let native_coin_client = token_contract::Client::new(&env, &native_coin_address);

    native_coin_client.initialize(&admin, &7, &String::from_str(&env, "TEST"), &String::from_str(&env, "TST"));
    native_coin_client.mint(&admin, &amount);
    native_coin_client.mint(&sender, &amount);


    let coin_flip = deploy_coin_flip(&env);
    coin_flip.initialize(&admin, &native_coin_address, &amount);

    coin_flip.flip(&sender, &flip_choice, &amount);
}
