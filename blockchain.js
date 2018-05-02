import { sha256 } from 'js-sha256';
import parseUrl from 'url-parse';
import axios from 'axios';

function forgeBlock(index, data, proof, previousHash) {
  return {
    index,
    timestamp: Date.now(),
    data,
    proof,
    previousHash,
  };
}

function blockString(block) {
  const dict = {};
  Object.keys(block).sort().forEach(key => dict[key] = block[key]);
  return JSON.stringify(dict).toString();
}

function getHashHex(string) {
  let hash = sha256.create();
  hash.update(string);
  return hash.hex();
}

class Blockchain {
  constructor() {
    this.chain = [];
    this.currentDataTransactions = [];
    this.nodes = new Set();

    this.newBlock(100, 1);
  }

  static validChain(chain) {
    let last = chain[0];
    let currentIndex = 1;

    while (currentIndex < chain.length) {
      const block = chain[currentIndex];
      if (block.previousHash !== Blockchain.hash(last)) return false;

      const isValidProof = Blockchain.validProof(last.proof, block.proof);
      if (!isValidProof) return false;

      last = block;
      currentIndex += 1;
    }

    return true;
  }

  async resolveConflicts() {
    let newChain = null;
    let maxLen = this.chain.length;

    const neighbors = Array.from(this.nodes);

    const responses = await Promise.all(neighbors.map(async node => {
      const resp = await axios.get(`http://${node}/chain`);
      const { length, chain } = resp.data;
      return { length, chain };
    }));

    responses.forEach(resp => {
      if (resp.length > maxLen && Blockchain.validChain(resp.chain)) {
        newChain = resp.chain;
        maxLen = resp.length;
      }
    });

    if (newChain) {
      this.chain = newChain;
      return true;
    }

    return false;
  }

  registerNode(address) {
    const url = parseUrl(address);
    this.nodes.add(url.host);
  }

  static validProof(lastProof, proof) {
    const guess = `${lastProof}${proof}`.toString();
    const guessHash = getHashHex(guess);

    return guessHash.substring(0, 4) === '0000';
  }

  /*
   * Proof of Work:
   * Find a number p' such that hash(pp') contains leading 4 zeroes, where p is
   * the previous proof, and p' is the new proof
  */
  static proofOfWork(lastProof) {
    let proof = 0;

    while (!Blockchain.validProof(lastProof, proof)) {
      proof += 1;
    }

    return proof;
  }

  newBlock(proof, previousHash) {
    const block = forgeBlock(
      this.chain.length + 1,
      this.currentDataTransactions,
      proof,
      previousHash || Blockchain.hash(this.lastBlock),
    );

    this.chain.push(block);
    this.currentDataTransactions = [];

    return block;
  }

  newDataTransaction(sender, recipient, data) {
    this.currentDataTransactions.push({
      sender,
      recipient,
      data,
    });

    return this.lastBlock.index + 1;
  }

  static hash(block) {
    const str = blockString(block);
    return getHashHex(str);
  }

  get lastBlock() {
    return this.chain[this.chain.length - 1];
  }
}

export default Blockchain;
