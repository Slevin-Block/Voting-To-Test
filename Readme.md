# Voting For Test
*practical application for Testing (Mocka, Chai) on Truffle*

## Access
Here, we list every test we make. The command to run the test is :
```
truffle test --network yourNetwork
```

I've set in truffle-config file, a network for ganache to the address **192.168.1.131** at port **7545** and the **5777** as network id. It was, for me, my testing network.
If you want use test net network (not a localhost network), create a .env with necessary informations like mnemonic, rpc and id.


## File to be tested

When you run the command above, you run `test.js` on `test` directory.
This file needs the smart contract file which you can find into `contracts` directory. The Voting smart contract we're going to test is the one you can find on the `Satochi Git Repository`. I didn't fix or modify any part of it and coded my test from it.


## Types of tests

To be specific, tests included in `test.js` are more `functional tests` than unit tests : a lot of operations are binded together and the functions execute several various operations like `require`, `data operations` and `emit`. So a test could verify this three things.

## Structure of tests

You can find three parts in the test file :
1. This contract inherits from `Ownable of OpenZeppelin librairies`, so you have to test the ownership. This part is named **`INITIALISATION`**.
2. The **`STRUCTURE MANAGEMENT`** is central to the voting process. So we have to check `rights of owner and voters` and the `state progress`. Especially on this last point, you can find a big test a the end of this part, which is a double nested `for of` loop. We want to verify that isn't possible to change state into another with isn't the planned next step. So the `double nested loop` tests all of the other possibilities and expects a error for each. It is the best way to do that, even if we test a lot of things into a unique test iteration.
3. The last part we need to test is the **`VOTING TIME MANAGEMENT`**. Into this part, we check the three important moments : the `Proposal Time`, `the Voting Time`, and the `Count Processing` to finish.

So you can find this complete structure :


```
    Initialisation
      The owner is the owner
    Structure Management
      Voters Management
        The owner isn't a voter
        The owner can add Voters
        The owner can't add the same Voter twice
        The owner can add a Voter only before start-proposals-Registation state
      State progress
        The owner can start Proposal Registration
        The Proposal state is prepared when Proposal Registration start
        The owner can deploy each state in order without problem
    Voting Time Management
      Proposal Time
        The Voter can make a proposal
        The proposal is correctly registered
        Proposal's rejected if empty
        Rejected if out of index's range search
      Voting Time
        A Voter cannot vote for an unexisting proposal
        A Voter can vote
        The vote is correctly registred (Voter & Proposal)
        A Voter cannot vote twice
      Count Processing
        Owner can ask for counting
        Everybody can check the winning proposal
```