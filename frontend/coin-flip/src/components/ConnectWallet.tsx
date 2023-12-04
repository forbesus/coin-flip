import { createContext, useContext, useState } from 'react';
import { useAccount, useIsMounted } from "../hooks";
import { setAllowed } from "@stellar/freighter-api";

import { Button, Tooltip, useClipboard } from "@chakra-ui/react";
import "./ConnectWallet.css";

export const ConnectWallet = () => {

  const mounted = useIsMounted();
  const account = useAccount();


  const formatShortAddress = (inputString: string, maxLength = 20) => {
    if (inputString.length <= maxLength) return inputString;
    const prefixLength = Math.floor((maxLength - 3) / 2);
    const suffixLength = maxLength - prefixLength - 3;
    const prefix = inputString.substring(0, prefixLength);
    const suffix = inputString.substring(inputString.length - suffixLength);
    return `${prefix}...${suffix}`;
  };

  type CopyButtonProps = {
    str: string;
    value: string;
    size: "sm" | "md" | "xs";
  };

  const CopyButton = ({ str, value, size = "xs" }: CopyButtonProps) => {
    const { onCopy, hasCopied } = useClipboard(value);
    return (
      <Tooltip closeOnClick={false} label={hasCopied ? "Copied!" : "Copy"}>
        <button
          type="button"
          className={`btn btn-primary m-4 ${"connect-wallet"}`}
          onClick={onCopy}
        >
          {str}
        </button>
      </Tooltip>
    );
  };

  return (
    <>
      {mounted && account ? (
        <CopyButton
          str={formatShortAddress(account?.address?.toString())}
          value={account?.address}
          size={"xs"} 
        />
        
      ) : (
        <button
          type="button"
          className={`btn btn-success m-4 ${"connect-wallet"}`}
          onClick={setAllowed}
        >
          Connect Wallet
        </button>
      )}
    </>
  );
};

export default ConnectWallet;
