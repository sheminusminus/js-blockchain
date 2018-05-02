import { sha256 } from 'js-sha256';

function getHashHex(string) {
  let hash = sha256.create();
  hash.update(string);
  return hash.hex();
}

class Block {
  constructor(timestamp, data) {
    this.index = 0;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = "0";
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    const str =
      `${this.index}${this.previousHash}${this.timestamp}${this.data}${this.nonce}`
      .toString();
    return getHashHex(str);
  }

  mineBlock(difficulty) {

  }
}

class Blockchain{
  constructor() {
    this.chain = [this.createGenesis()];
  }

  createGenesis() {
    const date = (new Date()).toLocaleDateString();
    return new Block(0, date, 'Genesis Block', '0');
  }

  latestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock){
    newBlock.previousHash = this.latestBlock().hash;
    newBlock.hash = newBlock.calculateHash();
    this.chain.push(newBlock);
  }

  checkValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }
}

let chain = new Blockchain();
chain.addBlock(new Block("12/25/2017", {amount: 5}));
chain.addBlock(new Block("12/26/2017", {amount: 10}));

console.log(JSON.stringify(chain, null, 4));
console.log("Is blockchain valid? " + chain.checkValid());


