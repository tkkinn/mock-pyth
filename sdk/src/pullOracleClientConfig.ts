import { AnchorProvider, Program } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { ConfirmOptions, PublicKey } from "@solana/web3.js";
import { MockPythPull } from "./types/mock_pyth_pull";

export type PullOracleClientConfig = {
    wallet: NodeWallet;
    provider: AnchorProvider;
    program?: Program<MockPythPull>;
    programId?: PublicKey;
    opts?: ConfirmOptions;
};