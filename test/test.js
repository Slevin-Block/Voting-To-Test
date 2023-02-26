const Voting = artifacts.require("./Voting.sol");
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('Voting', accounts => {

    const owner     = accounts[0];
    const first     = accounts[1];
    const second    = accounts[2];
    const third     = accounts[3];
    const fourth    = accounts[4];
    let VotingInstance;

    /**
     *  Initial Test to verify who is the owner of the instance
     */
    context("Initialisation", async () => {

        before(async () => {
            VotingInstance = await Voting.new({from : owner});
        });

        it("The owner is the owner", async () => {
            const theOwner = await VotingInstance.owner.call();
            expect(theOwner).to.be.equal(owner);
        });

    })


    /**
     *  Structure Managment Tests to verify the state of voting progress
     *  state data, require and event
     *  state deployment in the correct order (each case is tested)
     */
    context("Structure Management", async () => {

        /**
        *  Voters Managment Tests to verify creating progress
        */
        describe("Voters Management", async () => {
        
            before(async () => {
                VotingInstance = await Voting.new({from : owner});
            });

            it("The owner isn't a voter", async () => {
                await expectRevert(
                    VotingInstance.getVoter(owner, {from : owner}),
                    "You're not a voter"
                )
            });

            it("The owner can add Voters", async () => {           
                expectEvent(
                    await VotingInstance.addVoter(first, {from : owner}),
                    "VoterRegistered",
                    {voterAddress : first}
                )
                const newVoter  = await VotingInstance.getVoter(first, {from :first})
                expect(newVoter.isRegistered).to.be.true;
            });

            it("The owner can't add the same Voter twice", async () => {           
                await expectRevert(
                    VotingInstance.addVoter(first, {from : owner}),
                    "Already registered"
                )
            });

            it("The owner can add a Voter only before start-proposals-Registation state",
                async () => {    
                    await VotingInstance.startProposalsRegistering()
                    await expectRevert(
                        VotingInstance.addVoter(first, {from : owner}),
                        "Voters registration is not open yet"
                    )
                }
            );
        })

        /**
        *  State Progress Tests to verify the state of voting progress
        *  state data, require and event
        *  state deployment in the correct order (each case is tested)
        */
        describe("State progress", async () => {

            const states = [
                    {fnName : 'startProposalsRegistering', value : 1, errorMsg : 'Registering proposals cant be started now'},
                    {fnName : 'endProposalsRegistering', value : 2, errorMsg : 'Registering proposals havent started yet'},
                    {fnName : 'startVotingSession', value : 3, errorMsg : 'Registering proposals phase is not finished'},
                    {fnName : 'endVotingSession', value : 4, errorMsg : 'Voting session havent started yet'},
                    {fnName : 'tallyVotes', value : 5, errorMsg : 'Current status is not voting session ended'},
                ]

            beforeEach(async () => {
                VotingInstance = await Voting.new({from : owner});
            });

            it("The owner can start Proposal Registration", async () => {
                expectEvent(
                    await VotingInstance.startProposalsRegistering({from : owner}),
                    "WorkflowStatusChange",
                    {previousStatus : new BN(0), newStatus : new BN (1)}
                )
                const index= 0
                const fn = VotingInstance[states[index].fnName]
                await expectRevert(
                    fn({from : owner}),
                    states[index].errorMsg
                )
            });

            it("The Proposal state is prepared when Proposal Registration start", async () => {
                await VotingInstance.addVoter(first, {from : owner})
                await VotingInstance.startProposalsRegistering({from : owner})
                const proposal = await VotingInstance.getOneProposal(0, {from : first})
                expect(proposal.description).to.be.equal('GENESIS');
            })


            it("The owner can deploy each state in order without problem", async () => {
                expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(0))
                for (let currentState of states){
                    //console.log(`          === CurrentState [${currentState.value-1}]: ${currentState.fnName}`)
                    const currentFn = VotingInstance[currentState.fnName]
                    expectEvent(
                        await currentFn({from : owner}),
                        "WorkflowStatusChange",
                        {previousStatus : new BN(currentState.value-1), newStatus : new BN (currentState.value)}
                    )
                    for (let testingState of states){
                        /* The only good way is excluded, continue to the next step  */
                        if (testingState.value !== currentState.value +1){
                        //console.log(`               -> TestingState [${testingState.value-1}]: ${testingState.fnName}`)
                            const testFn = VotingInstance[testingState.fnName]
                            await expectRevert(
                                testFn({from : owner}),
                                testingState.errorMsg
                            )
                        }
                    }
                }
            });
        })    
    })

    /**
     *  Voting Time Managment Tests to verify the voting progress
     *  Proposal, voting and count
     */
    context("Voting Time Management", async () => {

        /**
        *  Proposal Time Tests to verify if a Voter can make Proposal
        */
        describe("Proposal Time", async () => {

            before( async () => {
                VotingInstance = await Voting.new({from : owner});
                await VotingInstance.addVoter(first, {from : owner})
                await VotingInstance.startProposalsRegistering({from : owner})
            })

            it("The Voter can make a proposal", async () => {
                expectEvent(
                    await VotingInstance.addProposal("Du jambon les mardis !", {from : first}),
                        'ProposalRegistered',
                    {proposalId : BN(1)}
                )
            })

            it("The proposal is correctly registered", async () => {
                const proposal = await VotingInstance.getOneProposal(1, {from : first})
                expect(proposal.description).to.be.equal('Du jambon les mardis !')
            })

            it("Proposal's rejected if empty", async () => {
                await expectRevert(
                    VotingInstance.addProposal("", {from : first}),
                        'Vous ne pouvez pas ne rien proposer'
                )
            })

            it("Rejected if out of index's range search", async () => {
                await expectRevert.unspecified(VotingInstance.getOneProposal(2, {from : first}))
            })
        })

        /**
        *  Voting Time Tests to verify if a Voter can vote for a only one Proposal 
        */
        describe("Voting Time", async () => {
            before( async () => {
                VotingInstance = await Voting.new({from : owner});
                await VotingInstance.addVoter(first, {from : owner})
                await VotingInstance.startProposalsRegistering({from : owner})
                await VotingInstance.addProposal("Du jambon les mardis !", {from : first})
                await VotingInstance.endProposalsRegistering({from : owner})
                await VotingInstance.startVotingSession({from : owner})
            })

            it("A Voter cannot vote for an unexisting proposal", async () => {
                await expectRevert(
                    VotingInstance.setVote(6, {from : first}),
                    'Proposal not found'
                )
            })

            it("A Voter can vote", async () => {
                expectEvent(
                    await VotingInstance.setVote(1, {from : first}),
                    'Voted',
                    {voter : first, proposalId : BN(1)}
                )
            })

            it("The vote is correctly registred (Voter & Proposal)", async () => {
                const voter = await VotingInstance.getVoter(first, {from : first})
                expect(voter.hasVoted).to.be.true
                const proposal = await VotingInstance.getOneProposal(1, {from : first})
                expect(proposal.voteCount).to.be.bignumber.equal(BN(1))
            })

            it("A Voter cannot vote twice", async () => {
                await expectRevert(
                    VotingInstance.setVote(1, {from : first}),
                    'You have already voted'
                )
            })
            
        })

        /**
        *  Count Processing Tests to verify the winning Proposal choiced by Voters 
        */
        describe("Count Processing", async () => {
            before( async () => {
                VotingInstance = await Voting.new({from : owner});
                await VotingInstance.addVoter(first, {from : owner})
                await VotingInstance.addVoter(second, {from : owner})
                await VotingInstance.addVoter(third, {from : owner})
                await VotingInstance.addVoter(fourth, {from : owner})
                await VotingInstance.startProposalsRegistering({from : owner})
                await VotingInstance.addProposal("Du jambon les mardis !", {from : first})
                await VotingInstance.addProposal("Du poisson les lundis !", {from : second})
                await VotingInstance.addProposal("Pas de café les vendredis !", {from : third})
                await VotingInstance.addProposal("Du cornichons les mercredis !", {from : fourth})
                await VotingInstance.addProposal("Pas de soupe les jeudis !", {from : fourth})
                await VotingInstance.endProposalsRegistering({from : owner})
                await VotingInstance.startVotingSession({from : owner})
                await VotingInstance.setVote(1, {from : first})
                await VotingInstance.setVote(3, {from : second})
                await VotingInstance.setVote(2, {from : third})
                await VotingInstance.setVote(3, {from : fourth})
                await VotingInstance.endVotingSession({from : owner})
            })

            it("Owner can ask for counting", async () => {
                // Already checked in State progress
                await VotingInstance.tallyVotes({from : owner})
            })

            it("Everybody can check the winning proposal", async () => {
                const winner = await VotingInstance.winningProposalID.call();
                expect(winner).to.be.bignumber.equal(BN(3))
            })
        })
    })
});