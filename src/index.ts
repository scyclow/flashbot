// For everything you need to know about this file, see https://www.youtube.com/watch?v=1ve1YIpDs_I


import { providers, Wallet } from "ethers"
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle"

// constants
const GWEI = 10n ** 9n
const ETHER = 10n ** 18n
const PRIORITY_FEE = 2
const MAX_FEE = 100

// goerli
// const FLASHBOTS_ENDPOINT = 'https://relay-goerli.flashbots.net'
// const CHAIN_ID = 5

// mainnet
const FLASHBOTS_ENDPOINT = 'https://relay.flashbots.net'
const CHAIN_ID = 1


// Include these as env variables
// DON'T EVEN FUCKING THINK ABOUT PUTTING THESE IN A FILE

// https://infura.io <- check out their free tier, create a project, and use the project id
const INFURA_KEY = process.env.INFURA_KEY

// Don't put much more than you need in this wallet
const FUNDING_WALLET_PRIVATE_KEY = process.env.FUNDING_WALLET_PRIVATE_KEY

// This wallet is already fucked.
const COMPROMISED_WALLET_PRIVATE_KEY = process.env.COMPROMISED_WALLET_PRIVATE_KEY

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
  maxFeePerGas: GWEI * BigInt(MAX_FEE),
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
const testBundle = [
  // Send the compromised wallet 0.05 ETH
  {
    transaction: tx({
      to: compromisedWallet.address,
      // There will probably be some ETH left over from this, which will be cleaned out immediately
      value: GWEI * BigInt(73294) * BigInt(MAX_FEE),
    }),
    signer: fundingWallet
  },

  /*
    Example of transfering an ENS entry to the destination wallet
    As the youtube video mentions, you can get the gasLimit and data from
    building the transaction in etherscan and viewing it in metamask.
  */
  {
    transaction: tx({
      to: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
      gasLimit: 73294,
      data: '0x42842e0e0000000000000000000000007c23c1b7e544e3e805ba675c811e287fc9d7194900000000000000000000000047144372eb383466d18fc91db9cd0396aa6c87a4b68d710504723bfc9350a3650da27bfbaa2988bc845afcc43f7f1ebc6e3d42f2'
    }),
    signer: compromisedWallet
  },

  // Bribe Miner -- my understanding is that you just need to put something here, but it's no longer important
    {
      transaction: tx({
        to: '0x8512a66D249E3B51000b772047C8545Ad010f27c',
        value: ETHER / 10000n,
      }),
      signer: fundingWallet
    },
  ]


//// Here are some bundles of actual transactions I ran





let i = 0
async function main() {
  console.log('Starting flashbot...')

  // Connect to the flashbots relayer -- this will communicate your bundle of transactions to
  // miners directly, and will bypass the mempool.
  let flashbotsProvider
  try {
    console.log('Retreiving Flashbots Provider...')
    flashbotsProvider = await FlashbotsBundleProvider.create(provider, Wallet.createRandom(), FLASHBOTS_ENDPOINT)
  } catch (err) {
    console.error(err)
  }

  const signedBundle = await flashbotsProvider.signBundle(testBundle)

  // Every time a new block has been detected, attempt to relay the bundle to miners for the next block
  // Since these transactions aren't in the mempool you need to submit this for every block until it
  // is filled. You don't have to worry about repeat transactions because nonce isn't changing. So you can
  // leave this running until it fills. I haven't found a good way to detect whether it's filled.
  provider.on('block', async blockNumber => {
    try {
      const nextBlock = blockNumber + 1
      console.log(`Preparing bundle for block: ${nextBlock}`)

      const txBundle = await flashbotsProvider.sendRawBundle(signedBundle, nextBlock)


      if ('error' in txBundle) {
        console.log('bundle error:')
        console.warn(txBundle.error.message)
        return
      }

      console.log('Submitting bundle')
      const response = await txBundle.simulate()
      if ('error' in response) {
        console.log('Simulate error')
        console.error(response.error)
        process.exit(1)
      }

      console.log('response:', response)

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

