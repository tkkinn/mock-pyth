# Mock Pyth Oracle on localnet
## Deploy the program to localnet
You are not able to use a normal deploy way as we don't have the keypair of this two program id
### Though `solana-test-validator`
You may use the my released program directly with this method
```
solana-test-validator \
    --bpf-program FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH ./path/to/program.so" # Push Oracle
    --bpf-program rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ "./path/to/program.so" # Pull Oracle
```
### Though `Anchor.toml`
You may use the my released program directly with this method
```
[[test.genesis]]
address = "FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH"
program = "./path/to/program.so"

[[test.genesis]]
address = "rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ"
program = "./path/to/program.so"
```


## SDK
### Install the SDK
```
yarn add @tkkinn/mock-pyth-sdk
```
### Initialize the client
Push oracle
```
const client = new pushOracleClient({
    provider,
    wallet,
    program,
});
```
Pull oracle
```
const pullOracle = new pullOracleClient({
    provider,
    wallet,
    program,
});
```
### Create Oracle
```
const [txId, priceFeed] = await pushOrcale.createOracle(uiPrice, expo, conf);
const [txId, priceFeed] = await pullOracle.createOracle(FeedId, uiPrice, expo, conf);
```
### Update Price
```
const txId = await pushOrcale.setPrice(PriceFeedPublicKey, uiPrice, expo, conf);
const txId = await pullOrcale.setPrice(PriceFeedPublicKey, uiPrice, expo, conf);
```