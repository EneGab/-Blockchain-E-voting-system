// routes/vote.js
const express  = require('express');
const crypto   = require('crypto');
const { ethers } = require('ethers');
const { db }   = require('../db/database');
const { voterAuth } = require('../middleware/authMiddleware');

const router = express.Router();

const VOTING_ABI = [
  'function recordVote(string memory voteHash) external',
  'function verifyVote(string memory voteHash) external view returns (bool)',
];

let contract = null;
function getContract() {
  if (contract) return contract;
  if (!process.env.RPC_URL || !process.env.PRIVATE_KEY || !process.env.CONTRACT_ADDRESS) {
    console.warn('⚠️  Blockchain env vars not set — votes will not be recorded on-chain.');
    return null;
  }
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, VOTING_ABI, wallet);
  return contract;
}

// GET /api/candidates
router.get('/', async (req, res) => {
  try {
    const candidates = await db('candidates').select('id', 'name', 'party').orderBy('name');
    return res.json({ candidates });
  } catch (err) {
    console.error('Get candidates error:', err);
    return res.status(500).json({ message: 'Failed to fetch candidates.' });
  }
});

// POST /api/vote/cast
router.post('/cast', voterAuth, async (req, res) => {
  const { candidate_id } = req.body;
  const voterId = req.voter.id;

  if (!candidate_id)
    return res.status(400).json({ message: 'Candidate ID is required.' });

  try {
    // 1. Check has_voted
    const voter = await db('voters').where('id', voterId).first();
    if (!voter)
      return res.status(404).json({ message: 'Voter not found.' });
    if (voter.has_voted === 1)
      return res.status(409).json({ message: 'You have already cast your vote.' });

    // 2. Validate candidate
    const candidate = await db('candidates').where('id', candidate_id).first();
    if (!candidate)
      return res.status(404).json({ message: 'Candidate not found.' });

    // 3. Generate vote hash
    const timestamp  = Date.now().toString();
    const electionId = 'ELECTION_2024';
    const raw        = `${candidate_id}:${voter.unique_id}:${timestamp}:${electionId}`;
    const voteHash   = crypto.createHash('sha256').update(raw).digest('hex');

    // 4. Send to blockchain
    let txHash = null;
    try {
      const votingContract = getContract();
      if (votingContract) {
        const tx      = await votingContract.recordVote(voteHash);
        const receipt = await tx.wait();
        txHash = receipt.hash;
        console.log(`✅ Vote recorded on-chain: ${txHash}`);
      }
    } catch (chainErr) {
      console.error('Blockchain error:', chainErr.message);
    }

    // 5. Persist to DB
    await db('votes').insert({
      voter_id:     voter.id,
      candidate_id: candidate.id,
      vote_hash:    voteHash,
      tx_hash:      txHash,
    });
    await db('voters').where('id', voter.id).update({ has_voted: 1 });
    await db('candidates').where('id', candidate.id).increment('vote_count', 1);

    return res.json({ message: 'Vote cast successfully.', voteHash, txHash });
  } catch (err) {
    console.error('Cast vote error:', err);
    return res.status(500).json({ message: 'Failed to record vote. Please contact support.' });
  }
});

module.exports = router;
