## Coin Flip

Coin Flip is a smart contract game built with [Soroban](https://soroban.stellar.org) on Stellar
blockchain, and ReactJs where players can double their XLM token by guessig the right occurance of Hear or Tail in a ccoin flip. To participate, you need to hold XLM tokens. Simply choose heads or tails, select your bet amount, and initiate the coin flip transaction through the Toss botton.

CoinFlip doesn't take any fee from the original bet if a user wins. 
The transactions occur on-chain, ensuring provable fairness. The odds of winning or losing in each coin flip are always 50/50.

This game is built for fun and players are requested to play responsibly.
Happy Tossing !


## Get Started

## Prerequisites

The first step you have to do is install Rust. You can follow the steps to install Rust in the following article:

- Node v18 - Install here: https://nodejs.org/en/download

- Rust - How to install Rust: https://soroban.stellar.org/docs/getting-started/setup#install-rust

- Soroban CLI - How to install Soroban CLI: https://soroban.stellar.org/docs/getting-started/setup#install-the-soroban-cli

- Stellar Account with test tokens on TEstnet - How to create new wallet using soroban-cli & receive test tokens: https://soroban.stellar.org/docs/getting-started/setup#configure-an-identity 

- Freighter Wallet - Wallet extension for interact with the app. Link: https://www.freighter.app



## Clone, Build, and Deploy Smart contract

1. Clone the repository:
    ```shell
    git clone https://github.com/simusud/coin-flip.git
    ```
2. Go to ```contracts/coin_flip```

3. Build the contract:
   ```shell
   soroban contract build
   ```

4. Deploy the contract to Testnet:
   ```shell
   soroban contract deploy \
   --wasm target/wasm32-unknown-unknown/release/coin_flip.wasm \
   --source alice \
   --network testnet
   ```
   After the deployment is complete, you will receive a **Contract Address**. Save that address to be used in calling
   the contract functions.

   The **Contract Address** will begin with **C.....**



### Stellar Native Asset Contract Address

This contract uses native coin of Stellar Network i.e. XLM. So we need a wrapped Stellar Asset in Soroban. The existing contact address of XLM in Soroban can be get with below command
```shell
soroban lab token id --asset native --network standalone
```

The XLM token contract address in Soroban is `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`.

## Calling Smart Contract Function

1. Contract Initialization
   <br> After deployment, the first function we should call is initialization. Call **initialize** function.
      ```shell
   soroban contract invoke \
    --id your_contract_id \
    --source alice \
    --network testnet \
    -- \
    initialize \
    --admin alice 
   ```
2. Set native coin address
   <br> Set the XLM contact address.
   ```shell
   soroban contract invoke \
    --id your_contract_id \
    --source alice \
    --network testnet \
    -- \
    set_native_coin \
    --address CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC 
   ```
3. Add XLM token to your contract
   <br> The contract needs to hold double the amount of the flip. So we need to transfer some XLM to the contract depending upon the maximum limit a player can bet.
   ```shell
   soroban contract invoke \
    --id CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC \
    --source alice \
    --network testnet \
    -- \
    transfer \
    --from alice \
    --to your_contract_id \
    --amount 1000000000 
   ```
   
4. Call flip function
   <br> This is a function to flip a coin. Enter the amount and flip choice to flip a coin. The amount showld be given with 7 decimals as XLM is a 7 decimal token. If you want to flip 5 XLM then it will be 50000000.
   <br> Required arguments: <u>Ledger amount</u>.
   ```shell
   soroban contract invoke \
    --id your_contract_id \
    --source alice \
    --network testnet \
    -- \
    flip \
    --sender your_address \
    --flip_choice "head" \
    --amount 10000000
   ```

Now if you win the toss you will receive the double the amount you flipped and if you lose you will your flip amount.



## Build, deploy & run the app frontend

### 1. Clone this repository:
   ```sh
   git clone https://github.com/simusud/coin-flip.git
   ```
### 2. Go to ```frontend/coin_flip```

### 3. Change the ***contractAddress*** value to the contract address that you deployed in ***FlipOptions.tsx*** file in line no. 52. 

### 4. Run the app
```sh
   npm run dev
   ```
You will see the localhost where the app will run.

### 5. Click on **Connect Wallet** botton in the app.

### 6. Enter the wallet password.

### 7. Enter the amount to bet.

### 8. Select the flip choice.

### 9. Click ***Toss*** botton to flip the coin.

### 10. Approve the transaction.

The process is complete, you will receive double the token amount if you win.




## License

The Coin Flip is under an MIT license. See the [LICENSE](LICENSE) for more information.


## Contact

[Twitter] -(https://twitter.com/simkhadasudeep9)
