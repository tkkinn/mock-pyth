"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pullOracleClient = void 0;
const anchor_1 = require("@coral-xyz/anchor");
const web3_js_1 = require("@solana/web3.js");
const mock_pyth_push_json_1 = __importDefault(require("./idl/mock_pyth_push.json"));
/**
 * The client to interact with push oracle contract
 */
class pullOracleClient {
    constructor(config) {
        this.provider = config.provider;
        this.wallet = config.wallet;
        if (!config.program) {
            const a = JSON.stringify(mock_pyth_push_json_1.default);
            const token_faucet_idl = JSON.parse(a);
            this.program = new anchor_1.Program(token_faucet_idl);
        }
        else {
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
    getCreateOracleIx(feedId, uiPrice, expo, conf) {
        return __awaiter(this, void 0, void 0, function* () {
            const priceFeed = web3_js_1.Keypair.generate();
            if (!conf)
                conf = (uiPrice / 10) * Math.pow(10, -expo);
            const initializePriceAccount = yield this.program.methods.initialize(feedId, new anchor_1.BN(uiPrice * Math.pow(10, -expo)), new anchor_1.BN(conf), expo).accounts({
                price: priceFeed.publicKey,
            }).instruction();
            const instructions = [initializePriceAccount];
            return [instructions, priceFeed];
        });
    }
    /**
     * Send the transaction to create oracle and write price.
     * @param uiPrice Human-readable prices to be set in the Oracle
     * @param expo price exponent
     * @param conf confidence interval around the price.
     * @returns Transaction signature and the public key of the price account.
     */
    createOracle(feedId, uiPrice, expo, conf) {
        return __awaiter(this, void 0, void 0, function* () {
            const [createOracleIx, priceFeed] = yield this.getCreateOracleIx(feedId, uiPrice, expo, conf);
            const txId = yield this.provider.connection.sendTransaction(yield this.v0_pack(createOracleIx, priceFeed), this.opts);
            return [txId, priceFeed.publicKey];
        });
    }
    /**
     * Build the instruction to write price.
     * @param priceFeed Public key of the price account
     * @param uiPrice Human-readable prices to be set in the Oracle
     * @param expo price exponent
     * @param conf confidence interval around the price.
     * @returns Packed Instruction of create oracle account and write price, The keypair of the price account to sign the transaction.
     */
    getSetPriceIx(priceFeed, uiPrice, expo, conf) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!conf)
                conf = (uiPrice / 10) * Math.pow(10, -expo);
            const setPrice = yield this.program.methods.setPrice(new anchor_1.BN(uiPrice * Math.pow(10, -expo)), new anchor_1.BN(conf)).accounts({
                price: priceFeed,
            }).instruction();
            return [setPrice];
        });
    }
    /**
    * Send the transaction to write price.
    * @param priceFeed Public key of the price account
    * @param uiPrice Human-readable prices to be set in the Oracle
    * @param expo price exponent
    * @param conf confidence interval around the price.
    * @returns Transaction signature and the public key of the price account.
    */
    setPrice(priceFeed, uiPrice, expo, conf) {
        return __awaiter(this, void 0, void 0, function* () {
            const setPriceIx = yield this.getSetPriceIx(priceFeed, uiPrice, expo, conf);
            const tx = yield this.provider.connection.sendTransaction(yield this.v0_pack(setPriceIx), this.opts);
            return tx;
        });
    }
    v0_pack(instructions, signer) {
        return __awaiter(this, void 0, void 0, function* () {
            const blockhash = yield this.provider.connection
                .getLatestBlockhash()
                .then(res => res.blockhash);
            const messageV0 = new web3_js_1.TransactionMessage({
                payerKey: this.wallet.publicKey,
                recentBlockhash: blockhash,
                instructions,
            }).compileToV0Message();
            const transaction = new web3_js_1.VersionedTransaction(messageV0);
            transaction.sign([this.wallet.payer]);
            if (signer != null)
                transaction.sign([signer]);
            return transaction;
        });
    }
}
exports.pullOracleClient = pullOracleClient;
