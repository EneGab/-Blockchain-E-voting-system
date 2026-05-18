// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Voting {
    address public admin;
    bool    public electionOpen;

    string[] private voteHashes;
    mapping(string => bool) private hashExists;

    event VoteRecorded(string voteHash, uint256 timestamp);
    event ElectionStarted(uint256 timestamp);
    event ElectionEnded(uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier electionIsOpen() {
        require(electionOpen, "Election is not open");
        _;
    }

    constructor() {
        admin        = msg.sender;
        electionOpen = false;
    }

    function startElection() external onlyAdmin {
        require(!electionOpen, "Election already open");
        electionOpen = true;
        emit ElectionStarted(block.timestamp);
    }

    function endElection() external onlyAdmin {
        require(electionOpen, "Election already closed");
        electionOpen = false;
        emit ElectionEnded(block.timestamp);
    }

    function recordVote(string memory voteHash) external electionIsOpen {
        require(bytes(voteHash).length > 0, "Vote hash cannot be empty");
        require(!hashExists[voteHash], "Duplicate vote hash");

        voteHashes.push(voteHash);
        hashExists[voteHash] = true;

        emit VoteRecorded(voteHash, block.timestamp);
    }

    function getTotalVotes() external view returns (uint256) {
        return voteHashes.length;
    }

    function getVoteHash(uint256 index) external view returns (string memory) {
        require(index < voteHashes.length, "Index out of bounds");
        return voteHashes[index];
    }

    function verifyVote(string memory voteHash) external view returns (bool) {
        return hashExists[voteHash];
    }
}