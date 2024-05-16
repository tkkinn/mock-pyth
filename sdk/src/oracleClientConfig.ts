import { AnchorProvider, Program } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { ConfirmOptions, PublicKey } from "@solana/web3.js";
import { MockPyth } from "./types/mock_pyth";

export type OracleClientConfig = {
    wallet: NodeWallet;
    provider: AnchorProvider;
    program?: Program<MockPyth>;
    programId?: PublicKey;
    opts?: ConfirmOptions;
};