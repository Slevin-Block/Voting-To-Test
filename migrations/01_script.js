const Voting = artifacts.require("Voting");

module.exports= async (deployer) => {
    /* const value = 1000000;
    const arg = 123; */
    await deployer.deploy(Voting/* , arg, {value} */);
    /* const instance = await SimpleStorage.deployed()
    console.log(await instance.get()); */
}
