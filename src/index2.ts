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
const testBundle = [
  // Send the compromised wallet 0.05 ETH
  {
    transaction: tx({
      to: compromisedWallet.address,
      // There will probably be some ETH left over from this, which will be cleaned out immediately
      value: GWEI * BigInt(73294) * BigInt(BASE_FEE),
    }),
    signer: fundingWallet
  },

  /*
    Example of transfering an ENS entry to the destination wallet
    As the youtube video mentions, you can get the gasLimit and data from
    building the transaction in etherscan and viewing it in metamask.
  */
  // {
  //   transaction: tx({
  //     to: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
  //     gasLimit: 73294,
  //     data: '0x42842e0e0000000000000000000000007c23c1b7e544e3e805ba675c811e287fc9d7194900000000000000000000000047144372eb383466d18fc91db9cd0396aa6c87a4b68d710504723bfc9350a3650da27bfbaa2988bc845afcc43f7f1ebc6e3d42f2'
  //   }),
  //   signer: compromisedWallet
  // },

  // Bribe Miner -- my understanding is that you just need to put something here, but it's no longer important
  {
    transaction: tx({
      to: '0x8512a66D249E3B51000b772047C8545Ad010f27c',
      value: ETHER / 10000n,
    }),
    signer: fundingWallet
  },
]


//// Here are three bundles of actual transactions I ran

// const bundle1 = [
//   // send the compromised wallet some eth
//   {
//     transaction: tx({
//       to: compromisedWallet.address,
//       value: 20n * ETHER / 1000n,
//     }),
//     signer: fundingWallet
//   },

//   // transfer steviep.eth
//   {
//     transaction: tx({
//       to: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
//       gasLimit: 74294,
//       data: '0x42842e0e0000000000000000000000007c23c1b7e544e3e805ba675c811e287fc9d7194900000000000000000000000047144372eb383466d18fc91db9cd0396aa6c87a4b68d710504723bfc9350a3650da27bfbaa2988bc845afcc43f7f1ebc6e3d42f2'
//     }),
//     signer: compromisedWallet
//   },

//   // transfer fakeinternetmoney.eth
//   {
//     transaction: tx({
//       to: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
//       gasLimit: 74294,
//       data: '0x42842e0e0000000000000000000000007c23c1b7e544e3e805ba675c811e287fc9d7194900000000000000000000000047144372eb383466d18fc91db9cd0396aa6c87a4df59cafb7b8e6afeef4fd35d9c3872705ea338188ed47e125d4fd646c6a72417'
//     }),
//     signer: compromisedWallet
//   },


//   // transfer subwayjesuspamphlets.eth
//   {
//     transaction: tx({
//       to: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
//       gasLimit: 74294,
//       data: '0x42842e0e0000000000000000000000007c23c1b7e544e3e805ba675c811e287fc9d7194900000000000000000000000047144372eb383466d18fc91db9cd0396aa6c87a4b84692235124fb32826d39831fee44e1de7ef8d6721c687d85e38e5602dceed9'
//     }),
//     signer: compromisedWallet
//   },

//   // miner bribe
//   {
//     transaction: tx({
//       to: '0x8512a66D249E3B51000b772047C8545Ad010f27c',
//       value: ETHER / 10000n,
//     }),
//     signer: fundingWallet
//   },
// ]



// const bundle2 = [
//   // send the compromised wallet some eth
//   {
//     transaction: tx({
//       to: compromisedWallet.address,
//       value: GWEI * BigInt(40663 + 40903 + 43597 + 186169 + 165139 + 144208 + 146265) * BigInt(BASE_FEE)
//     }),
//     signer: fundingWallet
//   },

//   // set fastcash central banker
//   {
//     transaction: tx({
//       to: '0xca5228d1fe52d22db85e02ca305cddd9e573d752',
//       data: '0x2adc7da300000000000000000000000047144372eb383466d18fc91db9cd0396aa6c87a4',
//       gasLimit: 40663,
//     }),
//     signer: compromisedWallet
//   },

//   // transfer discount fastcash ownership

//   {
//     transaction: tx({
//       to: '0x31004aDCEc5371F102e7fbA3c2485548324787Fe',
//       data: '0xf2fde38b00000000000000000000000047144372eb383466d18fc91db9cd0396aa6c87a4',
//       gasLimit: 40903
//     }),
//     signer: compromisedWallet
//   },

//   // transfer IOU ownership

//   {
//     transaction: tx({
//       to: '0x13178AB07A88f065EFe6D06089a6e6AB55AE8a15',
//       data: '0xf2fde38b00000000000000000000000047144372eb383466d18fc91db9cd0396aa6c87a4',
//       gasLimit: 43597
//     }),
//     signer: compromisedWallet
//   },


//   // transfer deafbeef First First
//   {
//     transaction: tx({
//       to: '0xc9Cb0FEe73f060Db66D2693D92d75c825B1afdbF',
//       data: '0x42842e0e0000000000000000000000007c23c1b7e544e3e805ba675c811e287fc9d7194900000000000000000000000047144372eb383466d18fc91db9cd0396aa6c87a40000000000000000000000000000000000000000000000000000000000000eb0',
//       gasLimit: 186169,

//     }),
//     signer: compromisedWallet
//   },


//   // transfer steviep cryptovoxels name
//   {
//     transaction: tx({
//       to: '0x4243a8413A77Eb559c6f8eAFfA63F46019056d08',
//       data: '0x42842e0e0000000000000000000000007c23c1b7e544e3e805ba675c811e287fc9d7194900000000000000000000000047144372eb383466d18fc91db9cd0396aa6c87a400000000000000000000000000000000000000000000000000000000000020a8',
//       gasLimit: 165139
//     }),
//     signer: compromisedWallet
//   },


//   // transfer Jay Pegs automart
//   {
//     transaction: tx({
//       to: '0xF210D5d9DCF958803C286A6f8E278e4aC78e136E',
//       data: '0x42842e0e0000000000000000000000007c23c1b7e544e3e805ba675c811e287fc9d7194900000000000000000000000047144372eb383466d18fc91db9cd0396aa6c87a400000000000000000000000000000000000000000000000000000000000011a5',
//       gasLimit: 144208
//     }),
//     signer: compromisedWallet
//   },

//   // transfer Enchiridion prototype
//   {
//     transaction: tx({
//       to: '0x2a680Bb87962a4bF00A9638e0f43AE0bb7164528',
//       data: '0x42842e0e0000000000000000000000007c23c1b7e544e3e805ba675c811e287fc9d7194900000000000000000000000047144372eb383466d18fc91db9cd0396aa6c87a40000000000000000000000000000000000000000000000000000000000000013',
//       gasLimit: 146265
//     }),
//     signer: compromisedWallet
//   },


//   // bribe miner
//   {
//     transaction: tx({
//       to: '0x8512a66D249E3B51000b772047C8545Ad010f27c',
//       value: ETHER / 10000n,
//     }),
//     signer: fundingWallet
//   },

// ]



// const bundle3 = [
//   // send the compromised wallet some eth
//   {
//     transaction: tx({
//       to: compromisedWallet.address,
//       value: GWEI * BigInt(89190+85345+85327) * BigInt(BASE_FEE)
//     }),
//     signer: fundingWallet
//   },

//   // Buddha Matt
//   {
//     transaction: tx({
//       gasLimit: 89190,
//       data: '0xf242432a0000000000000000000000007c23c1b7e544e3e805ba675c811e287fc9d7194900000000000000000000000047144372eb383466d18fc91db9cd0396aa6c87a40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000',
//       to: '0x28959Cf125ccB051E70711D0924a62FB28EAF186'
//     }),
//     signer: compromisedWallet
//   },


//   // chicken
//   {
//     transaction: tx({
//       gasLimit: 85345,
//       data: '0xf242432a0000000000000000000000007c23c1b7e544e3e805ba675c811e287fc9d7194900000000000000000000000047144372eb383466d18fc91db9cd0396aa6c87a40000000000000000000000000000000000000000000000000000000000016da2000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000',
//       to: '0xd07dc4262BCDbf85190C01c996b4C06a461d2430'
//     }),
//     signer: compromisedWallet
//   },


//   // tomorrow people
//   {
//     transaction: tx({
//       gasLimit: 85327,
//       data: '0xf242432a0000000000000000000000007c23c1b7e544e3e805ba675c811e287fc9d7194900000000000000000000000047144372eb383466d18fc91db9cd0396aa6c87a40000000000000000000000000000000000000000000000000000000000002730000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000',
//       to: '0x8f2256063036495F5a362a57757acFcBe72E44B9'
//     }),
//     signer: compromisedWallet
//   },

//   // bribe miner
//   {
//     transaction: tx({
//       to: '0x8512a66D249E3B51000b772047C8545Ad010f27c',
//       value: ETHER / 10000n,
//     }),
//     signer: fundingWallet
//   },

// ]


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

      if ('error' in bundleResponse) {
        throw new Error(bundleResponse.error.message)
      }
      const bundleResolution = await bundleResponse.wait()
      if (bundleResolution === FlashbotsBundleResolution.BundleIncluded) {
        console.log(`Congrats, included in ${blockNumber}`)
        process.exit(0)
      } else if (bundleResolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
        console.log(`Not included in ${blockNumber}`)
      } else if (bundleResolution === FlashbotsBundleResolution.AccountNonceTooHigh) {
        console.log("Nonce too high, bailing")
        process.exit(1)
      }

      /* console.log('Submitting bundle')
      const response = await bundleResponse.simulate()
      if ('error' in response) {
        console.log('Simulate error')
        console.error(response.error)
        process.exit(1)
      }

      console.log('response:', response) */

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

