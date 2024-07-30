import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { ConfirmOptions, Keypair, PublicKey, SystemProgram, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { MockPythPush } from "./types/mock_pyth_push";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import idl from "./idl/mock_pyth_push.json";
import { PushOracleClientConfig } from "./pushOracleClientConfig";

/**
 * The client to interact with push oracle contract
 */
export class pushOracleClient {
	provider: AnchorProvider;
	wallet: NodeWallet;
	public program: Program<MockPythPush>;
	opts?: ConfirmOptions;

	public constructor(config: PushOracleClientConfig) {
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

    /**
     * Build the instruction to create oracle and write price.
     * @param uiPrice Human-readable prices to be set in the Oracle
     * @param expo price exponent
     * @param conf confidence interval around the price.
     * @returns Packed Instruction of create oracle account and write price, The keypair of the price account to sign the transaction.
     */
    public async getCreateOracleIx(uiPrice: number, expo: number, conf?: number): Promise<[TransactionInstruction[], Keypair]> {
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

		const instructions: TransactionInstruction[] = [createPriceAccount, initializePriceAccount];
        return [instructions, priceFeed]
    }

    /**
     * Send the transaction to create oracle and write price.
     * @param uiPrice Human-readable prices to be set in the Oracle
     * @param expo price exponent
     * @param conf confidence interval around the price.
     * @returns Transaction signature and the public key of the price account.
     */
	public async createOracle(uiPrice: number, expo: number, conf?: number): Promise<[string, PublicKey]> {
		const [createOracleIx, priceFeed] = await this.getCreateOracleIx(uiPrice, expo, conf);
		const txId = await this.provider.connection.sendTransaction(await this.v0_pack(createOracleIx, priceFeed), this.opts);

		return [txId, priceFeed.publicKey];
	}

    /**
     * Build the instruction to write price.
     * @param priceFeed Public key of the price account
     * @param uiPrice Human-readable prices to be set in the Oracle
     * @param expo price exponent
     * @param conf confidence interval around the price.
     * @returns Packed Instruction of create oracle account and write price, The keypair of the price account to sign the transaction.
     */
    public async getSetPriceIx(priceFeed: PublicKey, uiPrice: number, expo: number, conf?: number): Promise<TransactionInstruction[]> {
        if (!conf) conf = (uiPrice / 10) * 10 ** -expo;
		const setPrice = await this.program.methods.setPrice(
			new BN(uiPrice * 10 ** -expo),
			new BN(conf)
		).accounts({
			price: priceFeed,
		}).instruction();

        return [setPrice];
    }

     /**
     * Send the transaction to write price.
     * @param priceFeed Public key of the price account
     * @param uiPrice Human-readable prices to be set in the Oracle
     * @param expo price exponent
     * @param conf confidence interval around the price.
     * @returns Transaction signature and the public key of the price account.
     */
	public async setPrice(priceFeed: PublicKey, uiPrice: number, expo: number, conf?: number): Promise<string> {
		const setPriceIx = await this.getSetPriceIx(priceFeed, uiPrice, expo, conf);
		const tx = await this.provider.connection.sendTransaction(await this.v0_pack(setPriceIx), this.opts);
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