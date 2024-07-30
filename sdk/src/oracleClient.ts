import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { ConfirmOptions, Keypair, PublicKey, SystemProgram, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { MockPyth } from "./types/mock_pyth";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { OracleClientConfig } from "./oracleClientConfig";
import idl from "./idl/mock_pyth.json";

/**
 * The client to build instruction to interact with onchain oracle
 * 
 * @deprecated Use the new {@link pushOracleClient} or {@link pullOracleClient} instead.
 */
export class oracleClient {
	provider: AnchorProvider;
	wallet: NodeWallet;
	public program: Program<MockPyth>;
	opts?: ConfirmOptions;

	public constructor(config: OracleClientConfig) {
		this.provider = config.provider;
		this.wallet = config.wallet;
		if (!config.program) {
			const a = JSON.stringify(idl)
			const token_faucet_idl = JSON.parse(a)
			this.program = new Program(token_faucet_idl);
		} else {
			this.program = config.program;
		}
		this.opts = config.opts;
	}

	public async createOracle(uiPrice: number, expo: number, conf?: number): Promise<[string, PublicKey]> {
		const priceFeed = Keypair.generate();
		if (!conf) conf = (uiPrice / 10) * 10 ** -expo;

		const createPriceAccount = SystemProgram.createAccount({
			fromPubkey: this.wallet.publicKey,
			newAccountPubkey: priceFeed.publicKey,
			space: 3312,
			lamports: await this.provider.connection.getMinimumBalanceForRentExemption(3312),
			programId: this.program.programId,
		});

		const initializePriceAccount = await this.program.methods.initialize(
			new BN(uiPrice * 10 ** -expo),
			expo,
			new BN(conf)
		).accounts({
			price: priceFeed.publicKey,
		}).instruction();

		const instructions = [createPriceAccount, initializePriceAccount];
		const txId = await this.provider.connection.sendTransaction(await this.v0_pack(instructions, priceFeed), this.opts);

		return [txId, priceFeed.publicKey];
	}

	public async initOracle(priceFeed: PublicKey, uiPrice: number, expo: number, conf?: number): Promise<string> {
		if (!conf) conf = (uiPrice / 10) * 10 ** -expo;
		const initializePriceAccount = await this.program.methods.initialize(
			new BN(uiPrice * 10 ** -expo),
			expo,
			new BN(conf)
		).accounts({
			price: priceFeed,
		}).instruction();

		const tx = await this.provider.connection.sendTransaction(await this.v0_pack([initializePriceAccount]), this.opts);
		return tx;
	}

	public async setPrice(priceFeed: PublicKey, uiPrice: number, expo: number, conf?: number): Promise<string> {
		if (!conf) conf = (uiPrice / 10) * 10 ** -expo;
		const setPrice = await this.program.methods.setPrice(
			new BN(uiPrice * 10 ** -expo),
			new BN(conf)
		).accounts({
			price: priceFeed,
		}).instruction();

		const tx = await this.provider.connection.sendTransaction(await this.v0_pack([setPrice]), this.opts);
		return tx;
	}

	async v0_pack(instructions: TransactionInstruction[], signer?: Keypair) {
		const blockhash = await this.provider.connection
			.getLatestBlockhash()
			.then(res => res.blockhash);

		const messageV0 = new TransactionMessage({
			payerKey: this.wallet.publicKey,
			recentBlockhash: blockhash,
			instructions,
		}).compileToV0Message();

		const transaction = new VersionedTransaction(messageV0);
		transaction.sign([this.wallet.payer]);
		if (signer != null) transaction.sign([signer]);

		return transaction;
	}

}