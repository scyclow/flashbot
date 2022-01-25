// For everything you need to know about this file, see https://www.youtube.com/watch?v=1ve1YIpDs_I

import { providers, Wallet, BigNumber } from 'ethers';
import { FlashbotsBundleProvider, FlashbotsBundleResolution } from '@flashbots/ethers-provider-bundle';
import { fromWei } from 'web3-utils';

// constants
const GWEI = BigNumber.from(10).pow(9);
const PRIORITY_FEE = GWEI.mul(3); // priority fee is 3 GWEI you can find current values of priority fee and base fee at https://etherscan.io/gastracker
const BLOCKS_IN_THE_FUTURE = 1;

// goerli
const FLASHBOTS_ENDPOINT = 'https://relay-goerli.flashbots.net';
const CHAIN_ID = 5;

// mainnet -  uncomment to run on ETH  mainnet
//const FLASHBOTS_ENDPOINT = 'https://relay.flashbots.net';
//const CHAIN_ID = 1;

// utils
const convertWeiToEth = (wei: BigNumber): string => {
  return fromWei(wei.toString(), 'ether');
};

const convertWeiToGwei = (wei: BigNumber): string => {
  return fromWei(wei.toString(), 'gwei');
};

// Include these as env variables
// https://infura.io <- check out their free tier, create a project, and use the project id
const INFURA_KEY = process.env.INFURA_KEY;

// Don't put much more than you need in this wallet
const FUNDING_WALLET_PRIVATE_KEY = process.env.FUNDING_WALLET_PRIVATE_KEY;

// This wallet is compromised
const COMPROMISED_WALLET_PRIVATE_KEY = process.env.COMPROMISED_WALLET_PRIVATE_KEY;

if (!(INFURA_KEY || FUNDING_WALLET_PRIVATE_KEY || COMPROMISED_WALLET_PRIVATE_KEY)) {
  console.log('Please include INFURA_KEY, FUNDING_WALLET_PRIVATE_KEY, and COMPROMISED_WALLET_PRIVATE_KEY as env variables.');
  process.exit(1);
}

// In default setting run only simulation - set SEND_BUNDLE=true to send bundle
const SEND_BUNDLE: string = process.env.SEND_BUNDLE;
if (SEND_BUNDLE === 'true') {
  console.log('Sending bundle');
} else {
  console.log('Running only simulation, please set SEND_BUNDLE=true to send bundle');
}

// Create clients to interact with infura and your wallets
const provider = new providers.InfuraProvider(CHAIN_ID, INFURA_KEY);
const fundingWallet = new Wallet(FUNDING_WALLET_PRIVATE_KEY, provider);
const compromisedWallet = new Wallet(COMPROMISED_WALLET_PRIVATE_KEY, provider);

// Cut down on some boilerplate
const tx = (args) => ({
  chainId: CHAIN_ID,
  type: 2, // EIP 1559
  maxPriorityFeePerGas: PRIORITY_FEE,
  data: '0x',
  value: 0n,
  ...args,
});

/*
  The basic idea here is that you want to you group together the
  following transactions such that no one can get in the middle of
  things and siphon off the ETH:
    1. Fund the compromised wallet
    2. Perform all the actions you need on that wallet (e.g. transfer nfts to safe account, or claim and transfer your SOS tokens, or unstake and transfer some staked tokens)

  This means that you will be executing transactions signed by at least two different wallets,
  and will likely be transfering assets to a third wallet.
*/

const getBundle = (maxBaseFeeInNextBlock: BigNumber) => {
  // Max fee in WEI that you want to pay for 1 unit of gas
  const maxFeePerGas: BigNumber = PRIORITY_FEE.add(maxBaseFeeInNextBlock);

  // You have to adjust total gas needed for all transactions from compromised wallet
  const totalGasNeeded: BigNumber = BigNumber.from(65036);
  const fundAmount: BigNumber = maxFeePerGas.mul(totalGasNeeded);
  // fundAmount = fundAmount.sub(GWEI.mul(896478)); - if u have some leftovers in compromised wallet you can adjust funding amount by substracting leftover
  console.log(`Priority fee:\t\t${PRIORITY_FEE} WEI, ${convertWeiToGwei(PRIORITY_FEE)} GWEI
Base fee:\t\t${maxBaseFeeInNextBlock} WEI, ${convertWeiToGwei(maxBaseFeeInNextBlock)} GWEI
Max fee per gas:\t${maxFeePerGas} WEI, ${convertWeiToGwei(maxFeePerGas)} GWEI
Fund amount:\t\t${fundAmount} WEI, ${convertWeiToGwei(fundAmount)} GWEI, ${convertWeiToEth(fundAmount)} ETH`);

  const bundle = [
    // Example transaction that i have used to rescue NFT on goerli network
    // Send funds for gas to compromised wallet from funding wallet
    // Take care when computing how much to send - eth scavenger will eat any leftovers
    {
      transaction: tx({
        to: compromisedWallet.address,
        maxFeePerGas,
        gasLimit: 21000,
        value: fundAmount,
      }),
      signer: fundingWallet,
    },
    // Transfer NFT
    // You have to make transaction to NFT contract address in order to transfer it
    // You can find out gas limit by simulating transaction and gas limit should be in simulate response
    // You will get transaction data from etherscan -
    //   1. Find NFT contract on etherscan
    //   2. Go to Write contract tab
    //   3. Connect metamask wallet
    //   4. Fill data for transferFrom method
    //   5. Copy hex transacton data from Metamask into data field below
    {
      transaction: tx({
        to: '0xf5de760f2e916647fd766b4ad9e85ff943ce3a2b',
        maxFeePerGas,
        gasLimit: 65036,
        data: '0x42842e0e000000000000000000000000beeadaeb8466b66cd1772747b695014f6540e2610000000000000000000000008cec4e83e0382cc99021b4f51a097d2dbaf705b50000000000000000000000000000000000000000000000000000000000035d65',
      }),
      signer: compromisedWallet,
    }
  ];
  return bundle;
};

let attempt: number = 0;
async function main() {
  console.log('Starting flashbot...');

  // Connect to the flashbots relayer -- this will communicate your bundle of transactions to
  // miners directly, and will bypass the mempool.
  let flashbotsProvider;
  try {
    console.log('Retreiving Flashbots Provider...');
    flashbotsProvider = await FlashbotsBundleProvider.create(provider, Wallet.createRandom(), FLASHBOTS_ENDPOINT);
  } catch (err) {
    console.error(err);
  }

  // Every time a new block has been detected, attempt to relay the bundle to miners for the next block
  // Since these transactions aren't in the mempool you need to submit this for every block until it
  // is filled. You don't have to worry about repeat transactions because nonce isn't changing. So you can
  // leave this running until it fills.
  provider.on('block', async (blockNumber) => {
    const targetBlock = blockNumber + BLOCKS_IN_THE_FUTURE;
    console.log(`Attempt: ${attempt} - Preparing bundle for block: ${targetBlock}`);
    try {
      const block = await provider.getBlock(blockNumber);
      const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getMaxBaseFeeInFutureBlock(block.baseFeePerGas, BLOCKS_IN_THE_FUTURE);
      console.log(`Max base fee in block ${targetBlock} is ${maxBaseFeeInFutureBlock} WEI`);
      // Prepare transactions
      const signedBundle = await flashbotsProvider.signBundle(getBundle(maxBaseFeeInFutureBlock));

      // Simulate the bundle first - it will make dry run and output any errors
      console.log('Running simulation');
      const simulation = await flashbotsProvider.simulate(signedBundle, targetBlock);
      if ('error' in simulation) {
        console.warn(`Simulation Error: ${simulation.error.message}`);
        process.exit(1);
      } else {
        console.log(`Simulation Success: ${JSON.stringify(simulation, null, 2)}`);
        console.log(simulation);
      }

      if (SEND_BUNDLE) {
        // Run bundle
        console.log('Run bundle');
        const txBundle = await flashbotsProvider.sendRawBundle(signedBundle, targetBlock);
        if ('error' in txBundle) {
          console.error('Fatal error in bundle:', txBundle.error);
          process.exit(1);
        }

        // Wait for response
        const waitResponse = await txBundle.wait();
        console.log(`Wait Response: ${FlashbotsBundleResolution[waitResponse]}`);
        if (waitResponse === FlashbotsBundleResolution.BundleIncluded) {
          console.log(`Bundle included in block ${targetBlock}`, waitResponse);
          process.exit(0);
        } else if (waitResponse === FlashbotsBundleResolution.AccountNonceTooHigh) {
          console.log(`Nonce too high (block: ${targetBlock})`, waitResponse);
          process.exit(0);
        } else if (waitResponse === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
          console.log(`Not included in ${blockNumber}`, waitResponse);
        } else {
          console.log('Unexpected response obtained', waitResponse);
        }
      }
      attempt++;
    } catch (err) {
      console.error('Fatal request error', err);
      process.exit(1);
    }
  });
}

main();
