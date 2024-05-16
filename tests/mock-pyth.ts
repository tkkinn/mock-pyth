import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MockPyth } from "../target/types/mock_pyth";
import { v0_pack } from "./helper";
import { TestContract } from "../target/types/test_contract";

describe("mock-pyth", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MockPyth as Program<MockPyth>;
  const test = anchor.workspace.TestContract as Program<TestContract>;
  const admin = anchor.Wallet.local();
  const priceFeed = anchor.web3.Keypair.generate();

  it("Initializes price account", async () => {
    const initialize_price = await program.methods.initialize(
      new anchor.BN(100 * 10 ** 7),
      -9,
      new anchor.BN(100 / 10 * 10 * 9)
    ).accounts({
      price: priceFeed.publicKey,
    }).instruction();

    const createAccount = anchor.web3.SystemProgram.createAccount({
      fromPubkey: admin.publicKey,
      newAccountPubkey: priceFeed.publicKey,
      space: 3312,
      lamports: await program.provider.connection.getMinimumBalanceForRentExemption(3312),
      programId: program.programId,
    });

    const readPrice = await test.methods.readPrice().accounts({
      price: priceFeed.publicKey,
    }).instruction();

    const instructions = [createAccount, initialize_price, readPrice];
    const tx = await provider.connection.sendTransaction(await v0_pack(instructions, admin, priceFeed));
    console.log("Transaction Id:", tx);
  });

  it("Sets price", async () => {
    const setPrice = await program.methods.setPrice(
      new anchor.BN(200 * 10 ** 7),
      new anchor.BN(200 / 10 * 10 * 9)
    ).accounts({
      price: priceFeed.publicKey,
    }).instruction();

    const readPrice = await test.methods.readPrice().accounts({
      price: priceFeed.publicKey,
    }).instruction();

    const instructions = [setPrice, readPrice];
    const tx = await provider.connection.sendTransaction(await v0_pack(instructions, admin), {skipPreflight: true});
    console.log("Transaction Id:", tx);
  });
});
