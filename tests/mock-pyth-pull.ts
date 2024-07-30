import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MockPythPull } from "../target/types/mock_pyth_pull";
import { v0_pack } from "./helper";
import { TestContract } from "../target/types/test_contract";
import { confirmTransaction } from "@solana-developers/helpers";

describe("mock-pyth-pull", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.MockPythPull as Program<MockPythPull>;
    const test = anchor.workspace.TestContract as Program<TestContract>;
    const admin = anchor.Wallet.local();
    const priceFeed = anchor.web3.Keypair.generate();

    const SOL_FeedId = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

    it("Initializes price account", async () => {
        const initialize_price = await program.methods.initialize(
            SOL_FeedId, new anchor.BN(100 * 10 ** 7),
            new anchor.BN(100 / 10 * 10 ** 9),
            -9,
        ).accounts({
            payer: admin.publicKey,
            price: priceFeed.publicKey
        }).instruction();

        const readPrice = await test.methods.readPricePull(SOL_FeedId).accounts({
            price: priceFeed.publicKey,
        }).instruction();

        const instructions = [initialize_price, readPrice];
        const tx = await provider.connection.sendTransaction(await v0_pack(instructions, admin, priceFeed));
        await confirmTransaction(provider.connection, tx);
        console.log("Transaction Id:", tx);
    })


    it("Sets price", async () => {
        const setPrice = await program.methods.setPrice(
            new anchor.BN(200 * 10 ** 7),
            new anchor.BN(200 / 10 * 10 ** 9)
        ).accounts({
            price: priceFeed.publicKey,
        }).instruction();

        const readPrice = await test.methods.readPricePull(SOL_FeedId).accounts({
            price: priceFeed.publicKey,
        }).instruction();

        const instructions = [setPrice, readPrice];
        const tx = await provider.connection.sendTransaction(await v0_pack(instructions, admin), { skipPreflight: true });
        console.log("Transaction Id:", tx);
    });
})