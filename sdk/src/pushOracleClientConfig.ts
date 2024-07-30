import { AnchorProvider, Program } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { ConfirmOptions, PublicKey } from "@solana/web3.js";
import { MockPythPush } from "./types/mock_pyth_push";

export type PushOracleClientConfig = {
    wallet: NodeWallet;
    provider: AnchorProvider;
    program?: Program<MockPythPush>;
    programId?: PublicKey;
    opts?: ConfirmOptions;
};