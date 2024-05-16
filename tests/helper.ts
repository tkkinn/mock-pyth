import * as anchor from "@coral-xyz/anchor";
import { TransactionMessage, VersionedTransaction } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();

export async function v0_pack(instructions: anchor.web3.TransactionInstruction[], payer: anchor.web3.Keypair | anchor.Wallet, signer: anchor.web3.Keypair = null) {
    const blockhash = await provider.connection
        .getLatestBlockhash()
        .then(res => res.blockhash);

    const messageV0 = new TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash: blockhash,
        instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    if (payer instanceof anchor.Wallet) transaction.sign([payer.payer]);
    else if (payer instanceof anchor.web3.Keypair) transaction.sign([payer]);
    if (signer) transaction.sign([signer]);

    return transaction;
}
