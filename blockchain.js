import { sha256 } from 'js-sha256';

function forgeBlock(index, transactions, proof, previousHash) {
  return {
    index,
    timestamp: Date.now(),
    transactions,
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
    this.currentTransactions = [];

    this.newBlock(100, 1);
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

  newBlock(proof, previousHash = null) {
    const block = forgeBlock(
      this.chain.length + 1,
      this.currentTransactions,
      proof,
      previousHash || Blockchain.hash(this.lastBlock),
    );

    this.currentTransactions = [];
    this.chain.push(block);

    return block;
  }

  newTransaction(sender, recipient, amount) {
    this.currentTransactions.push({
      sender,
      recipient,
      amount,
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
