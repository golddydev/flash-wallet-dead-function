require("dotenv").config();
const { ethers, utils } = require("ethers");

const provider = new ethers.providers.JsonRpcProvider(
  process.env.BSCTEST_RPC_URL
);

const heritorWallet = new ethers.Wallet(
  process.env.BSCTEST_HERITOR_PRIVATE_KEY,
  provider
);

const testatorWallet = new ethers.Wallet(
  process.env.BSCTEST_TESTATOR_PRIVATE_KEY,
  provider
);

const heritorAddress = "0x632Bd9a598cd5c52F1625c850A6c46ECd4Cb7829";
const testatorAddress = "0xB1e50315BbDa7D9Fd7e4F030e26eEC585A1Efc0c";

const busdTokenAddress = "0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7";
const erc20Abi =
  require("./artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json").abi;
const busdToken = new ethers.Contract(busdTokenAddress, erc20Abi, provider);

const willContractAddress = "0x8F89c72A77B775F07D716b2208d702C4805b8890";
const willContractAbi = require("./artifacts/contracts/Will.sol/Will.json").abi;
const willContract = new ethers.Contract(
  willContractAddress,
  willContractAbi,
  provider
);

const approve = async (heritor) => {
  try {
    console.log("Preparing...");
    const balance = await busdToken.balanceOf(heritor);
    const txn = await busdToken.populateTransaction.approve(
      willContractAddress,
      balance
    );
    const txnRes = await heritorWallet.sendTransaction(txn);
    await txnRes.wait();
    console.log("-".repeat(10) + "Success - prepared" + "-".repeat(10));
  } catch (err) {
    console.log("-".repeat(10) + "Fail" + "-".repeat(10));
    console.log("Something went wrong.");
  }
};

const addWill = async (testator, afterTime = 120) => {
  try {
    await approve(heritorAddress);
    //after 120s
    console.log("Start Adding will...");
    const txn = await willContract.populateTransaction.addWill(
      testator,
      afterTime
    );
    const txnRes = await heritorWallet.sendTransaction(txn);
    await txnRes.wait();
    console.log("-".repeat(10) + "Success - added will" + "-".repeat(10));
    console.log(
      `After ${afterTime} seconds, testator(${testator}) can receive will.`
    );
  } catch (err) {
    console.log("-".repeat(10) + "Fail" + "-".repeat(10));
    console.log("Something went wrong.");
  }
};

const receiveWill = async (heritor) => {
  try {
    console.log("Start receiving will...");
    const txn = await willContract.populateTransaction.receiveWill(heritor);
    const txnRes = await testatorWallet.sendTransaction(txn);
    await txnRes.wait();
    console.log("-".repeat(10) + "Success - received will" + "-".repeat(10));
  } catch (err) {
    console.log("-".repeat(10) + "Fail" + "-".repeat(10));
    if (JSON.stringify(err).includes("Will: Heritor is not correct.")) {
      console.log("Heritor is not correct");
    } else if (JSON.stringify(err).includes("Will: Too soon")) {
      console.log("Too soon. Just wait.");
    } else {
      console.log("Something went wrong");
    }
  }
};

(async () => {
  await addWill(testatorAddress, 180);
  // await receiveWill(heritorAddress);
})();
