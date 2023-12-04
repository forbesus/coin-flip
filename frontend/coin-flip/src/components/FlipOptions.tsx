import React, { useState } from "react";
import "./FlipOptions.css";
import { getPublicKey, signTransaction } from "@stellar/freighter-api";
import {
  Keypair,
  Contract,
  Server,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Address,
  nativeToScVal,
  xdr,
  SorobanRpc,
} from "soroban-client";

export const SendTxStatus: {
  [index: string]: SorobanRpc.SendTransactionStatus;
} = {
  Pending: "PENDING",
  Duplicate: "DUPLICATE",
  Retry: "TRY_AGAIN_LATER",
  Error: "ERROR",
};
export const accountToScVal = (account: string) =>
  new Address(account).toScVal();

export const numberToI128 = (value: number): xdr.ScVal =>
  nativeToScVal(value, { type: "i128" });

function FlipOptions() {
  const [amount, setAmount] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");

  const handleOptionClicked = (option: React.SetStateAction<string>) => {
    setSelectedOption(option);
    console.log(option + " Clicked");
  };

  async function handleTossClick() {
    // const {
    //   Keypair,
    //   Contract,
    //   Server,
    //   TransactionBuilder,
    //   Networks,
    //   BASE_FEE,
    // } = require("soroban-client");

    console.log("Clicked");
    let caller = await getPublicKey();
    console.log("value copied here");
    console.log(caller);

    if (selectedOption) {
      console.log("here");
      signTransaction;
      
      const server = new Server("https://soroban-testnet.stellar.org", {
        allowHttp: true,
      });
      const contractAddress =
        "CCRMHNFSSDHZHFSPZQSWWVNALILUP7R2PEWD2DL7GBVHO6VGCMFJ2FQV";
      const contract = new Contract(contractAddress);

      console.log("account ok");
      const sourceAccount = await server.getAccount(caller);
      console.log("source ok");
      let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            "flip",
            ...[accountToScVal(caller), numberToI128(amount)]
          )
        )
        .setTimeout(30)
        .build();
      console.log("build ok");

      let preparedTransaction = builtTransaction.toXDR();
      try {
        const signedTx = await signTransaction(preparedTransaction);
        const tx = TransactionBuilder.fromXDR(signedTx, Networks.TESTNET);
        const sendResponse = await server.sendTransaction(tx);
        if (sendResponse.errorResult) {
          throw new Error("Unable to submit transaction");
        }
      
        if (sendResponse.status === SendTxStatus.Pending) {
          let txResponse = await server.getTransaction(sendResponse.hash);
      
          // Poll this until the status is not "NOT_FOUND"
          while (txResponse.status === SorobanRpc.GetTransactionStatus.NOT_FOUND) {
            // See if the transaction is complete
            // eslint-disable-next-line no-await-in-loop
            txResponse = await server.getTransaction(sendResponse.hash);
            // Wait a second
            // eslint-disable-next-line no-await-in-loop
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
      
          if (txResponse.status === SorobanRpc.GetTransactionStatus.SUCCESS) {
            return txResponse.resultXdr.toXDR("base64");
          }
          // eslint-disable-next-line no-else-return
        }
        throw new Error(
          `Unabled to submit transaction, status: ${sendResponse.status}`,
        );
        console.log(sendResponse)
        console.log("prapare ok");
      } catch (error) {
        console.log(error);
      }
      // console.log("prapare ok")
      // const signedTx = await signTransaction(preparedTransaction);

      //   preparedTransaction.sign(sourceKeypair);
      //   console.log(
      //     `Signed prepared transaction XDR: ${preparedTransaction
      //       .toEnvelope()
      //       .toXDR("base64")}`
      //   );
      //   try {
      //     let sendResponse = await server.sendTransaction(preparedTransaction);
      //     console.log(`Sent transaction: ${JSON.stringify(sendResponse)}`);

      //     if (sendResponse.status === "PENDING") {
      //       let getResponse = await server.getTransaction(sendResponse.hash);
      //       // Poll `getTransaction` until the status is not "NOT_FOUND"
      //       while (getResponse.status === "NOT_FOUND") {
      //         console.log("Waiting for transaction confirmation...");
      //         // See if the transaction is complete
      //         getResponse = await server.getTransaction(sendResponse.hash);
      //         // Wait one second
      //         await new Promise((resolve) => setTimeout(resolve, 1000));
      //       }

      //       console.log(
      //         `getTransaction response: ${JSON.stringify(getResponse)}`
      //       );

      //       if (getResponse.status === "SUCCESS") {
      //         // Make sure the transaction's resultMetaXDR is not empty
      //         if (!getResponse.resultMetaXdr) {
      //           throw "Empty resultMetaXDR in getTransaction response";
      //         }
      //         // Find the return value from the contract and return it
      //         let transactionMeta = getResponse.resultMetaXdr;
      //         let returnValue = transactionMeta.v3().sorobanMeta().returnValue();
      //         console.log(`Transaction result: ${returnValue.value()}`);
      //       } else {
      //         throw `Transaction failed: ${getResponse.resultXdr}`;
      //       }
      //     } else {
      //       throw sendResponse.errorResultXdr;
      //     }
      //   } catch (err) {
      //     // Catch and report any errors we've thrown
      //     console.log("Sending transaction failed");
      //     console.log(JSON.stringify(err));
      //   }
    } else {
      console.error("Please select either Heads or Tails.");
    }
  }

  const handleAmountChange = (e: { target: { value: any; }; }) => {
    const inputAmount = e.target.value;
    if (
      inputAmount === 0 ||
      (inputAmount[0] !== 0 && /^\d*\.?\d*$/.test(inputAmount))
    ) {
      setAmount(inputAmount);
    }
  };

  return (
    <>
      <div className="coin-flip-container">
        <div className="input-container">
          <label>
            Enter Amount:
            <input type="number" value={amount} onChange={handleAmountChange} />
          </label>
        </div>

        <div className="choice-button-container">
          <button
            type="button"
            className={`btn btn-primary m-4 ${
              selectedOption === "Heads" ? "clicked" : ""
            }`}
            onClick={() => handleOptionClicked("head")}
          >
            Head
          </button>
          <button
            type="button"
            className={`btn btn-primary m-4 ${
              selectedOption === "Heads" ? "clicked" : ""
            }`}
            onClick={() => handleOptionClicked("tail")}
          >
            Tail
          </button>
        </div>
        {selectedOption && (
          <div className="selected-option">
            <p>You selected: {selectedOption}</p>
          </div>
        )}
        <div className="toss-button-container">
          <button
            type="button"
            className="btn btn-primary m-5"
            onClick={handleTossClick}
            disabled={selectedOption === null}
          >
            Toss
          </button>
        </div>
      </div>
    </>
  );
}

export default FlipOptions;
