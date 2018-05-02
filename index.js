import express from 'express';
import bodyParser from 'body-parser';
import uuid from 'uuid4';

import Blockchain from './blockchain';

const blockChain = new Blockchain();
const nodeId = uuid().toString().replace('-', '');
const app = express();

const args = process.argv;
const port = args[2] || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));

app.get('/mine', (req, res) => {
  const lastBlock = blockChain.lastBlock;
  const lastProof = lastBlock.proof;
  const proof = Blockchain.proofOfWork(lastProof);

  blockChain.newDataTransaction(0, nodeId, 1);

  const previousHash = Blockchain.hash(lastBlock);
  const block = blockChain.newBlock(proof, previousHash);

  const response = {
    message: 'New block forged',
    index: block.index,
    data: block.data,
    proof: block.proof,
    previousHash: block.previousHash,
  };

  return res.status(200).json(response);
});

app.post('/transactions', (req, res) => {
  const { sender, recipient, data } = req.body;

  if (!sender || !recipient || !data) {
    return res.sendStatus(400);
  }

  const index = blockChain.newDataTransaction(sender, recipient, data);
  const response = { message: `Data transaction added to block ${index}` };

  return res.status(200).json(response);
});

app.get('/chain', (req, res) => {
  const response = {
    chain: blockChain.chain,
    length: blockChain.chain.length,
  };

  return res.status(200).json(response);
});

app.post('/nodes/register', (req, res) => {
  const { nodes } = req.body;

  if (!nodes) return res.sendStatus(400);

  const nodeArray = JSON.parse(nodes);
  nodeArray.forEach(node => blockChain.registerNode(node));

  const response = {
    message: 'New nodes added',
    totalNodes: blockChain.nodes.entries(),
  };

  return res.status(200).json(response);
});

app.get('/nodes/resolve', async (req, res) => {
  const response = { message: '', newChain: blockChain.chain };
  const replaced = await blockChain.resolveConflicts();
  if (replaced) {
    response.message = 'Chain replaced';
  } else {
    response.message = 'Chain is authoritative';
  }
  return res.status(200).json(response);
});

app.listen(port, () => console.log(`Listening on port ${port}`));
