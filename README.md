# 1st Goerli test
We have send 2 NFTs from Compromised walled to Safe wallet using 3rd wallet - funging wallet. All transactions are submitted in the same block.

## Before test
Compromised wallet - please note balance is 0 before test
<img width="1435" alt="Screen Shot 2021-12-09 at 12 49 35" src="https://user-images.githubusercontent.com/8282513/145393815-d73b6f47-27e9-4101-8795-c96bfe83abe6.png">

Safe wallet
<img width="1417" alt="Screen Shot 2021-12-09 at 12 49 43" src="https://user-images.githubusercontent.com/8282513/145393826-9d53acb0-97da-4d05-9fc1-015075b1525a.png">

## After test
Compromised wallet - 2 outgoing transactions to MultiFaucet NFT contract
<img width="1417" alt="Screen Shot 2021-12-09 at 12 54 23" src="https://user-images.githubusercontent.com/8282513/145393763-a85a48e6-5796-4650-afbb-08dceb2345a8.png">

Safe wallet - incoming 2 NEW NFT tokens
<img width="1417" alt="Screen Shot 2021-12-09 at 12 55 40" src="https://user-images.githubusercontent.com/8282513/145393779-74f73d67-238a-4f31-b6da-def60ba467eb.png">


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

# Sources
- Blogpost from SteveP - Compromised - https://steviep.xyz/txt/compromised
- Repo from SteveP (this repo is fork) - https://github.com/scyclow/flashbot

- Frontrunning a scammer from whitehat perspective - https://amanusk.medium.com/frontrunning-a-scammer-95f34dd33cf8
- Frontrunning a scammer from victims perspective - https://www.reddit.com/r/CryptoCurrency/comments/om7ecc/frontrunning_a_scammer_pov_from_the_whitehat/

- Flashbots docs https://docs.flashbots.net/
- Flashbots repo - ive used bits of code from this repo https://github.com/flashbots/searcher-sponsored-tx

# Edit for our purpose
Edited script is saved in src/index2.ts

# Opened questions
1. How to find out priority fee and base fee params (https://github.com/scyclow/flashbot/blob/555e55b6023ecd27a76ff6ea894f4a5e2cb133ea/src/index.ts#L10)
Resolution?: Using GasTracker to get current values https://etherscan.io/gastracker

2. How to determine the number of transactions in one bundle?
https://github.com/scyclow/flashbot/blob/555e55b6023ecd27a76ff6ea894f4a5e2cb133ea/src/index.ts#L68

3. How to get miner address for miner bribe and how to estimate amount of bribe 
https://github.com/scyclow/flashbot/blob/555e55b6023ecd27a76ff6ea894f4a5e2cb133ea/src/index.ts#L96

4. How to estimate gas transaction and get transaction data - i have been using etherscan.io and MetaMask but fee is insanely high. I was trying on NFT contract write *safeTransferFrom* method
<img width="1422" alt="Screen Shot 2021-12-07 at 13 51 44" src="https://user-images.githubusercontent.com/8282513/145187810-c870942a-f379-4b3b-b13d-8431d99431cc.png">

# Plan
1. Create Infura project and retrieve API key - DONE
2. Estimate gas prices
3. Create transaction data using Etherscan.io and Metamask
4. Test on goerli
5. Run it

