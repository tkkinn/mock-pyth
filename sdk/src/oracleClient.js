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
exports.oracleClient = void 0;
const anchor_1 = require("@coral-xyz/anchor");
const web3_js_1 = require("@solana/web3.js");
const mock_pyth_json_1 = __importDefault(require("./idl/mock_pyth.json"));
/**
 * The client to build instruction to interact with onchain oracle
 *
 * @deprecated Use the new {@link pushOracleClient} or {@link pullOracleClient} instead.
 */
class oracleClient {
    constructor(config) {
        this.provider = config.provider;
        this.wallet = config.wallet;
        if (!config.program) {
            const a = JSON.stringify(mock_pyth_json_1.default);
            const token_faucet_idl = JSON.parse(a);
            this.program = new anchor_1.Program(token_faucet_idl);
        }
        else {
            this.program = config.program;
        }
        this.opts = config.opts;
    }
    createOracle(uiPrice, expo, conf) {
        return __awaiter(this, void 0, void 0, function* () {
            const priceFeed = web3_js_1.Keypair.generate();
            if (!conf)
                conf = (uiPrice / 10) * Math.pow(10, -expo);
            const createPriceAccount = web3_js_1.SystemProgram.createAccount({
                fromPubkey: this.wallet.publicKey,
                newAccountPubkey: priceFeed.publicKey,
                space: 3312,
                lamports: yield this.provider.connection.getMinimumBalanceForRentExemption(3312),
                programId: this.program.programId,
            });
            const initializePriceAccount = yield this.program.methods.initialize(new anchor_1.BN(uiPrice * Math.pow(10, -expo)), expo, new anchor_1.BN(conf)).accounts({
                price: priceFeed.publicKey,
            }).instruction();
            const instructions = [createPriceAccount, initializePriceAccount];
            const txId = yield this.provider.connection.sendTransaction(yield this.v0_pack(instructions, priceFeed), this.opts);
            return [txId, priceFeed.publicKey];
        });
    }
    initOracle(priceFeed, uiPrice, expo, conf) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!conf)
                conf = (uiPrice / 10) * Math.pow(10, -expo);
            const initializePriceAccount = yield this.program.methods.initialize(new anchor_1.BN(uiPrice * Math.pow(10, -expo)), expo, new anchor_1.BN(conf)).accounts({
                price: priceFeed,
            }).instruction();
            const tx = yield this.provider.connection.sendTransaction(yield this.v0_pack([initializePriceAccount]), this.opts);
            return tx;
        });
    }
    setPrice(priceFeed, uiPrice, expo, conf) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!conf)
                conf = (uiPrice / 10) * Math.pow(10, -expo);
            const setPrice = yield this.program.methods.setPrice(new anchor_1.BN(uiPrice * Math.pow(10, -expo)), new anchor_1.BN(conf)).accounts({
                price: priceFeed,
            }).instruction();
            const tx = yield this.provider.connection.sendTransaction(yield this.v0_pack([setPrice]), this.opts);
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
exports.oracleClient = oracleClient;
