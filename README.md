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

## Usage
*Simulation* - only dry run - this will not execute transaction processing only to see if everything is set up correctly
`INFURA_KEY=<infura_key> FUNDING_WALLET_PRIVATE_KEY=<funding_PK> COMPROMISED_WALLET_PRIVATE_KEY=<compromised_PK> npm run start`

*Run bundle* - this will execute bundle
`INFURA_KEY=<infura_key> FUNDING_WALLET_PRIVATE_KEY=<funding_PK> COMPROMISED_WALLET_PRIVATE_KEY=<compromised_PK> SEND_BUNDLE=true npm run start`

- !!! DON'T EVEN THINK ABOUT PUTTING YOUR PRIVAT KEYS IN A JSON FILE !!!
- Also, keep your funding wallet lean. Definitely don't store a lot of crypto + NFTs in it.
- If you absolutely must put your keys in a file, then name the file `secrets.json`, which is included in this repo's .gitignore


# Sources
- Blogpost from SteveP - Compromised - https://steviep.xyz/txt/compromised
- Repo from SteveP - https://github.com/scyclow/flashbot

- Frontrunning a scammer from whitehat perspective - https://amanusk.medium.com/frontrunning-a-scammer-95f34dd33cf8
- Frontrunning a scammer from victims perspective - https://www.reddit.com/r/CryptoCurrency/comments/om7ecc/frontrunning_a_scammer_pov_from_the_whitehat/

- StackExchange Q - https://ethereum.stackexchange.com/questions/112097/how-to-tranfer-remaining-nfts-and-or-tokens-out-of-a-hacked-ethereum-wallet
- Medium blog - https://medium.com/coinmonks/rescuing-an-nft-fd0acccfa25a
- Code - https://github.com/microbecode/flashbot

*Flashbots*
- Flashbots docs https://docs.flashbots.net/
- Flashbots repo https://github.com/flashbots
- Searcher - https://github.com/flashbots/searcher-sponsored-tx
- Demo - https://github.com/flashbots/ethers-provider-flashbots-bundle
