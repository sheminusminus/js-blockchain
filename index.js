import express from 'express';
import bodyParser from 'body-parser';
import uuid from 'uuid4';

import Blockchain from './blockchain';

const blockChain = new Blockchain();
const nodeId = uuid().toString().replace('-', '');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));

app.get('/mine', (req, res) => {
  const lastBlock = blockChain.lastBlock;
  const lastProof = lastBlock.proof;
  const proof = Blockchain.proofOfWork(lastProof);

  blockChain.newTransaction(0, nodeId, 1);

  const previousHash = Blockchain.hash(lastBlock);
  const block = blockChain.newBlock(proof, previousHash);

  const response = {
    message: 'New block forged',
    index: block.index,
    transactions: block.transactions,
    proof: block.proof,
    previousHash: block.previousHash,
  };

  return res.status(200).json(response);
});

app.post('/transactions', (req, res) => {
  const { sender, recipient, amount } = req.body;

  if (!sender || !recipient || !amount) {
    return res.sendStatus(400);
  }

  const index = blockChain.newTransaction(sender, recipient, amount);
  const response = { message: `Transaction added to block ${index}` };

  return res.status(200).json(response);
});

app.get('/chain', (req, res) => {
  const response = {
    chain: blockChain.chain,
    length: blockChain.chain.length,
  };

  return res.status(200).json(response);
});

app.listen(5000, () => console.log('Listening on port 5000'));
