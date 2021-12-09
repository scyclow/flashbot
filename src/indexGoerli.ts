// For everything you need to know about this file, see https://www.youtube.com/watch?v=1ve1YIpDs_I


import { providers, Wallet } from "ethers"
import { FlashbotsBundleProvider, FlashbotsBundleResolution } from "@flashbots/ethers-provider-bundle"

// constants
const GWEI = 10n ** 9n
const ETHER = 10n ** 18n
const PRIORITY_FEE = 5
const BASE_FEE = 100

// goerli
const FLASHBOTS_ENDPOINT = 'https://relay-goerli.flashbots.net'
const CHAIN_ID = 5

// mainnet
// const FLASHBOTS_ENDPOINT = 'https://relay.flashbots.net'
// const CHAIN_ID = 1

// ======== Wallet Info =========
// 3 wallets are needed in this setup -> compromised wallet (private key), funding wallet (private key), safe wallet (only public key !!!!)
// Include these as env variables
// DON'T EVEN FUCKING THINK ABOUT PUTTING THESE IN A FILE

// https://infura.io <- check out their free tier, create a project, and use the project id
const INFURA_KEY = process.env.INFURA_KEY

// Don't put much more than you need in this wallet
const FUNDING_WALLET_PRIVATE_KEY = process.env.FUNDING_WALLET_PRIVATE_KEY

// This wallet is already fucked.
const COMPROMISED_WALLET_PRIVATE_KEY = process.env.COMPROMISED_WALLET_PRIVATE_KEY

// Public key of safe wallet - you want to send your NFTs to this one
const SAFE_WALLET_PUBLIC_KEY = '0x2fd995f584BEb83787Db3f8dae2Bf0f0dcB34f5d';

if (!(INFURA_KEY || FUNDING_WALLET_PRIVATE_KEY || COMPROMISED_WALLET_PRIVATE_KEY)) {
  console.log('Please include INFURA_KEY, FUNDING_WALLET_PRIVATE_KEY, and COMPROMISED_WALLET_PRIVATE_KEY as env variables.')
  process.exit(1)
}

// Create clients to interact with infura and your wallets
const provider = new providers.InfuraProvider(CHAIN_ID, INFURA_KEY)
const fundingWallet = new Wallet(FUNDING_WALLET_PRIVATE_KEY, provider)
const compromisedWallet = new Wallet(COMPROMISED_WALLET_PRIVATE_KEY, provider)

// Cut down on some boilerplate
const tx = (args) => ({
  chainId: CHAIN_ID,
  type: 2, // EIP 1559
  maxFeePerGas: GWEI * BigInt(BASE_FEE),
  maxPriorityFeePerGas: GWEI * BigInt(PRIORITY_FEE),
  data: '0x',
  value: 0n,
  ...args
})


/*
  The basic idea here is that you want to you group together the
  following transactions such that no one can get in the middle of
  things and siphon off the ETH:
    1. Fund the compromised wallet
    2. Perform all the actions you need on that wallet
    3. Bribe the miner

  This means that you will be executing transactions signed by at least two different wallets,
  and will likely be transfering assets to a third wallet.

*/
// NFTs contract address
const MULTI_FAUCET_TOKEN_CONTRACT_ADDR = '0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b';
const testBundle = [
  // Send the compromised wallet 0.05 ETH
  {
    transaction: tx({
      to: compromisedWallet.address,
      // There will probably be some ETH left over from this, which will be cleaned out immediately
      value: GWEI * BigInt(73294 + 73294) * BigInt(BASE_FEE),
    }),
    signer: fundingWallet
  },

  /*
    Example of transfering an ENS entry to the destination wallet (safe wallet)
    As the youtube video mentions, you can get the gasLimit and data from
    building the transaction in etherscan and viewing it in metamask.
    Transfer 2 NFTs in bundle
  */
  {
    transaction: tx({
      to: MULTI_FAUCET_TOKEN_CONTRACT_ADDR,
      gasLimit: 73294,
      data: '0x42842e0e00000000000000000000000079e8af1d6e14b5eb0fd00a16d495525313a0078a0000000000000000000000002fd995f584beb83787db3f8dae2bf0f0dcb34f5d0000000000000000000000000000000000000000000000000000000000035d68'
    }),
    signer: compromisedWallet
  },
  {
    transaction: tx({
      to: MULTI_FAUCET_TOKEN_CONTRACT_ADDR,
      gasLimit: 73294,
      data: '0x42842e0e00000000000000000000000079e8af1d6e14b5eb0fd00a16d495525313a0078a0000000000000000000000002fd995f584beb83787db3f8dae2bf0f0dcb34f5d0000000000000000000000000000000000000000000000000000000000035d65'
    }),
    signer: compromisedWallet
  },

  // Bribe Miner -- my understanding is that you just need to put something here, but it's no longer important
  // So far no idea how to determine bribe amount and bribe address
  // Steves answer: My understanding is that the miner bribe is vestigial, and the values in my code are a workaround. So it should be fine to just leave those. Not sure what they should be on testnet though.
  {
    transaction: tx({
      to: '0x8512a66D249E3B51000b772047C8545Ad010f27c',
      value: ETHER / 10000n,
    }),
    signer: fundingWallet
  },
]

let i = 0
async function main() {
  console.log('Starting flashbot...')

  // Connect to the flashbots relayer -- this will communicate your bundle of transactions to
  // miners directly, and will bypass the mempool.
  let flashbotsProvider
  try {
    console.log('Retreiving Flashbots Provider...')
    flashbotsProvider = await FlashbotsBundleProvider.create(provider, Wallet.createRandom(), FLASHBOTS_ENDPOINT)
    console.log('Provider obtained');
  } catch (err) {
    console.error(err)
  }

  // Every time a new block has been detected, attempt to relay the bundle to miners for the next block
  // Since these transactions aren't in the mempool you need to submit this for every block until it
  // is filled. You don't have to worry about repeat transactions because nonce isn't changing. So you can
  // leave this running until it fills. I haven't found a good way to detect whether it's filled.
  provider.on('block', async blockNumber => {
    try {
      const nextBlock = blockNumber + 1
      console.log(`Preparing bundle for block: ${nextBlock}`)

      const signedBundle = await flashbotsProvider.signBundle(testBundle)
      const bundleResponse = await flashbotsProvider.sendRawBundle(signedBundle, nextBlock)

      // Simulate
      const response = await bundleResponse.simulate()
      if ('error' in response) {
        console.log('Simulate error')
        console.error(response.error)
        process.exit(1)
      }
      console.log('simulate response:', response);

      if ('error' in bundleResponse) {
        throw new Error(bundleResponse.error.message)
      }
      const bundleResolution = await bundleResponse.wait()
      console.log('response:', bundleResolution);
      if (bundleResolution === FlashbotsBundleResolution.BundleIncluded) {
        console.log(`Congrats, included in ${blockNumber}`)
        process.exit(0)
      } else if (bundleResolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
        console.log(`Not included in ${blockNumber}`)
      } else if (bundleResolution === FlashbotsBundleResolution.AccountNonceTooHigh) {
        console.log("Nonce too high, bailing")
        process.exit(1)
      }

      console.log(`Try: ${i} -- block: ${nextBlock}`)
      i++

    } catch (err) {
      console.log('Request error')
      console.error(err)
      process.exit(1)
    }
  })
}

// Bada bing, bada boom, beep boop. Run your flash bot
main()

