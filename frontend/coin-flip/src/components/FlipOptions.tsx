import React, { useState } from "react";
import "./FlipOptions.css";
import {
  getPublicKey,
  signAuthEntry,
  signBlob,
  signTransaction,
} from "@stellar/freighter-api";

import {
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
  nativeToScVal(value * 10 ** 7, { type: "i128" });

export const StringToScVal = (value: string): xdr.ScVal =>
  nativeToScVal(value, { type: "string" });

function FlipOptions() {
  const [amount, setAmount] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [coinFlipResult, setCoinFlipResult] = useState("");

  async function handleTossClick() {
    let caller = await getPublicKey();
    console.log(caller);

    if (selectedOption) {
      const server = new Server("https://soroban-testnet.stellar.org", {
        allowHttp: true,
      });
      const contractAddress =
        "CAMQ6NEYZO4TBP2T5G6MD7Y3NR2XUAE55NJXQ573TB5LGP6WANRC3WUT";
      const contract = new Contract(contractAddress);

      const sourceAccount = await server.getAccount(caller);
      let builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            "flip",
            ...[
              accountToScVal(caller),
              StringToScVal(selectedOption),
              numberToI128(amount),
            ]
          )
        )
        .setTimeout(30);

      let _buildTransaction = await server.prepareTransaction(
        builtTransaction.build(),
        Networks.TESTNET
      );
      let preparedTransaction = _buildTransaction.toXDR();

      try {
        const signedTx = await signTransaction(preparedTransaction, {
          networkPassphrase: Networks.TESTNET,
          accountToSign: caller,
        });
        console.log(signedTx);

        const tx = TransactionBuilder.fromXDR(signedTx, Networks.TESTNET);
        const sendResponse = await server.sendTransaction(tx);
        console.log(sendResponse.status);
        if (sendResponse.errorResult) {
          throw new Error("Unable to submit transaction");
        }

        if (sendResponse.status === SendTxStatus.Pending) {
          let txResponse = await server.getTransaction(sendResponse.hash);

          // Poll this until the status is not "NOT_FOUND"
          while (
            txResponse.status === SorobanRpc.GetTransactionStatus.NOT_FOUND
          ) {
            // See if the transaction is complete
            // eslint-disable-next-line no-await-in-loop
            txResponse = await server.getTransaction(sendResponse.hash);
            // Wait a second
            // eslint-disable-next-line no-await-in-loop
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          if (txResponse.status === SorobanRpc.GetTransactionStatus.SUCCESS) {
            console.log(txResponse);
            
            // check return value from contract and show result in app
            let result = txResponse.returnValue['_value'];
            console.log(result)
            setCoinFlipResult(`Star-crossed! You lost ${amount} XLM.` )
            if (result == true) {
              setCoinFlipResult(`Thrilled! You won ${amount * 2} XLM.` )
            }
            setTimeout(() => {
              setCoinFlipResult('');
            }, 5000);
            return txResponse.resultXdr.toXDR("base64");
          }
          // eslint-disable-next-line no-else-return
        }
        throw new Error(
          `Unabled to submit transaction, status: ${sendResponse.status}`
        );
      } catch (err) {
        // Catch and report any errors we've thrown
        console.log("Sending transaction failed");
        console.log(JSON.stringify(err));
        setErrorMessage(`Transaction failed. Please try again ! ${JSON.stringify(err)} `);
        setTimeout(() => {
          setErrorMessage('');
        }, 4000);
      }
    } else {
      console.error("Please select either Heads or Tails.");
      setErrorMessage(`Please select either Head or Tail.`);
      setTimeout(() => {
        setErrorMessage('');
      }, 4000);
    }
  }

  const handleOptionClicked = (option: React.SetStateAction<string>) => {
    setSelectedOption(option);
  };

  const handleAmountChange = (e: { target: { value: any } }) => {
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
        {/* Display the error message if it exists */}
        {errorMessage && (
          <div style={{ color: "red", margin: "20px" }}>
            Error: {errorMessage}
          </div>
        )}
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
              selectedOption === "head" ? "clicked" : ""
            }`}
            onClick={() => handleOptionClicked("head")}
          >
            Head
          </button>
          <button
            type="button"
            className={`btn btn-primary m-4 ${
              selectedOption === "tail" ? "clicked" : ""
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
            disabled={!selectedOption || amount === 0}
            className="btn btn-primary m-5"
            onClick={handleTossClick}
          >
            Toss
          </button>
        </div>
        {coinFlipResult && <div className="toss-result">{coinFlipResult}</div>}
      </div>
    </>
  );
}

export default FlipOptions;
