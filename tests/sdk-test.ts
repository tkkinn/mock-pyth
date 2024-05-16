import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MockPyth } from "../target/types/mock_pyth";
import { v0_pack } from "./helper";
import { TestContract } from "../target/types/test_contract";
import { oracleClient } from "../sdk/src/oracleClient";

describe("SDK for mock-pyth", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.MockPyth as Program<MockPyth>;
    const test = anchor.workspace.TestContract as Program<TestContract>;
    const admin = anchor.Wallet.local();

    let priceFeedPublicKey: anchor.web3.PublicKey;

    const orcale = new oracleClient({ provider: provider, wallet: admin, program: program, opts: { skipPreflight: true }});

    it("Initializes price account", async () => {
        const [txId, priceFeed] = await orcale.initOracle(100, -9, 100 / 10);
        priceFeedPublicKey = new anchor.web3.PublicKey(priceFeed);
        console.log("Transaction Id:", txId);
        const readPrice = await test.methods.readPrice().accounts({
            price: priceFeedPublicKey,
          }).rpc({skipPreflight: true});
        console.log("Read price transaction:", readPrice)
    });

    it("Sets price", async () => {
        const txId = await orcale.setPrice(priceFeedPublicKey, 200, -9, 200 / 10);
        console.log("Transaction Id:", txId);
        const readPrice = await test.methods.readPrice().accounts({
            price: priceFeedPublicKey,
          }).rpc();
        console.log("Read price transaction:", readPrice)
    });
});
