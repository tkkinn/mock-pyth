import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { v0_pack } from "./helper";
import { TestContract } from "../target/types/test_contract";
import { pushOracleClient } from "../sdk/src/pushOracleClient";
import { pullOracleClient } from "../sdk/src/pullOracleClient";
import { MockPythPush } from "../target/types/mock_pyth_push";
import { MockPythPull } from "../target/types/mock_pyth_pull";
import { confirmTransaction } from "@solana-developers/helpers";

describe("SDK for mock-pyth", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const push = anchor.workspace.MockPythPush as Program<MockPythPush>;
    const pull = anchor.workspace.MockPythPull as Program<MockPythPull>;
    const test = anchor.workspace.TestContract as Program<TestContract>;
    const admin = anchor.Wallet.local();

    let pushPriceFeedPK: anchor.web3.PublicKey;
    let pullPriceFeedPK: anchor.web3.PublicKey;

    const SOL_FeedId = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";


    const pushOrcale = new pushOracleClient({ provider: provider, wallet: admin, program: push, opts: { skipPreflight: true } });
    const pullOracle = new pullOracleClient({ provider: provider, wallet: admin, program: pull, opts: { skipPreflight: true } });

    describe("Push Oracle", () => {
        it("Create Oracle", async () => {
            const [txId, priceFeed] = await pushOrcale.createOracle(100, -9, 100 / 10);
            pushPriceFeedPK = priceFeed;
            console.log("Create Oracle: ", txId);
            await confirmTransaction(provider.connection, txId);
            const readPriceTx = await test.methods.readPricePush().accounts({
                price: pushPriceFeedPK
            }).rpc();
            console.log("Read Price: ", readPriceTx);
        });

        it("Set Price", async()=> {
            const txId = await pushOrcale.setPrice(pushPriceFeedPK, 100, -9);
            console.log("Set Price: ", txId);
            await confirmTransaction(provider.connection, txId);
            const readPriceTx = await test.methods.readPricePush().accounts({
                price: pushPriceFeedPK
            }).rpc();
            console.log("Read Price: ", readPriceTx);
        })

    });

    describe("Pull Oracle", () => {
        it("Create Oracle", async () => {
            const [txId, priceFeed] = await pullOracle.createOracle(SOL_FeedId, 100, -9, 100 / 10);
            pullPriceFeedPK = priceFeed;
            console.log("Create Oracle: ", txId);
            await confirmTransaction(provider.connection, txId);
            const readPriceTx = await test.methods.readPricePull(SOL_FeedId).accounts({
                price: pullPriceFeedPK
            }).rpc();
            console.log("Read Price: ", readPriceTx);
        });

        it("Set Price", async()=> {
            const txId = await pullOracle.setPrice(pullPriceFeedPK, 100, -9);
            console.log("Set Price: ", txId);
            await confirmTransaction(provider.connection, txId);
            const readPriceTx = await test.methods.readPricePull(SOL_FeedId).accounts({
                price: pullPriceFeedPK
            }).rpc();
            console.log("Read Price: ", readPriceTx);
        })

    })
});