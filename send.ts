import { networks, Psbt,  } from "bitcoinjs-lib";
import ECPairFactory from "ecpair";
import * as tinysecp from "tiny-secp256k1"
const sender_WIF = "cS8bhzBso6M21MnigRtRUVPPgG9qSMnrcsoBPjzkw8Bch8La6JVd";
const rec_pkh = "tb1q9cwthujqtjddj89q6f8ky9lec85z873t3msyn0";

const testnet = networks.testnet;
const ECPair = ECPairFactory(tinysecp);
const keyPair = ECPair.fromWIF(sender_WIF, testnet);
const utxo_txid = "ecdd8a83d153ae29dee52b59b207df29bea2972d052dd007330eca1a851c9b59";


const transaction = new Psbt({network: testnet}); 

transaction.addInput({
  hash: utxo_txid,
  index: 0,
  witnessUtxo: {
    script: Buffer.from("0014eda1bcb51d38cefa21f04fcba0e5c2e46097d84d", 'hex'),
    value: 64613
  }
});

transaction.addOutput({
  address: rec_pkh,
 value: 5000,
});

transaction.signInput(0, keyPair);
transaction.finalizeAllInputs();
const signed_tx = transaction.extractTransaction().toHex();
console.log('Signed Raw Transaction:', signed_tx);
