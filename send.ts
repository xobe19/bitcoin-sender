import { networks, Psbt,  address, crypto} from "bitcoinjs-lib";
import ECPairFactory from "ecpair";
import * as tinysecp from "tiny-secp256k1"
import mempoolJS from "@mempool/mempool.js";
import axios from "axios";

const testnet = networks.testnet;
const ECPair = ECPairFactory(tinysecp);
const utxo_txid = "ecdd8a83d153ae29dee52b59b207df29bea2972d052dd007330eca1a851c9b59";

function getPKHfromPublicKey(publicKey: Buffer) {
return address.toBech32(crypto.ripemd160(crypto.sha256(publicKey)),0, 'tb'); 
}


async function createTransaction(sender_WIF : string, rec_pkh: string, satoshis: number, fees :number) {

const senderKeyPair = ECPair.fromWIF(sender_WIF, testnet);

const senderPKH = (getPKHfromPublicKey(senderKeyPair.publicKey))
console.log(senderPKH)
  const { bitcoin: { addresses, transactions } } = mempoolJS({
    hostname: 'mempool.space',
    network: 'testnet'
  });

  const addressTxsUtxo = await addresses.getAddressTxsUtxo({ address: senderPKH });

  console.log("utxo's");
  console.log(addressTxsUtxo);

  const transaction = new Psbt({network: testnet});

  let tot_balance = 0;
  let inputs = 0;

  for(let utxo of addressTxsUtxo) {
    let transaction_details = await transactions.getTx({txid: utxo.txid})
    tot_balance += utxo.value;
    inputs += 1;
    console.log("adding input");
    transaction.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: Buffer.from(transaction_details.vout[utxo.vout].scriptpubkey, 'hex'),
        value: utxo.value
      }
    });
  }



  transaction.addOutput({
    address: rec_pkh,
    value: satoshis
  });

  
  let rem_balance = tot_balance - satoshis - fees;
  if(rem_balance < 0) throw new Error("insufficient funds");
  transaction.addOutput({
    address: senderPKH,
    value: rem_balance
  })

  for(let i = 0; i < inputs; i++) {
    transaction.signInput(i, senderKeyPair);
  }
  transaction.finalizeAllInputs();
  const signed_tx = transaction.extractTransaction().toHex();

  console.log(signed_tx);
  console.log("broadcasting...");

  


let txid = axios.request({
  method: "POST",
  maxBodyLength: Infinity,
  url: 'https://mempool.space/testnet/api/tx',
  headers: { 
    'Content-Type': 'text/plain'
  },
  data: signed_tx
})

  console.log("sent!")
  console.log(txid);

  


}


createTransaction("cS8bhzBso6M21MnigRtRUVPPgG9qSMnrcsoBPjzkw8Bch8La6JVd", "tb1q9cwthujqtjddj89q6f8ky9lec85z873t3msyn0", 500, 2000);
