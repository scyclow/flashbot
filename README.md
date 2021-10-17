# Flashbot recovery example
- The problem: One of your wallets has been compromised, and any ETH you put on ther is siphoned off immediately. You would like to retrieve some assets or transfer contract ownership, but that all costs gas and your gas tank is stuck on empty.
- The solution: Flashbots!
- The code for this repo provides an example of how

- This is the actual code I used (with added comments) to recover assets from a compromised wallet
- Most of this code was taken from the example provided by https://www.youtube.com/watch?v=1ve1YIpDs_I

## Setup
- `npm install`
- Construct a list of transactions. You can get the gasLimit and tx data by doing a dry run with metamask and/or etherscan
- Test out on goerli
- Run on mainnet

## Running the script
- DON'T EVEN THINK ABOUT PUTTING YOUR PRIVAT KEYS IN A JSON FILE.
- Also, keep your funding wallet lean. Definitely don't store a lot of crypto + NFTs in it.
- If you absolutely must put your keys in a file, then name the file `secrets.json`, which is included in this repo's .gitignore
- Pass everything in as environment variables, like so:
- `INFURA_KEY=<...> FUNDING_WALLET_PRIVATE_KEY=<...> COMPROMISED_WALLET_PRIVATE_KEY=<...> npm run start`