import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT, REGISTRY_PORT, BASE_ONION_ROUTER_PORT } from "../config";
import { Node, GetNodeRegistryBody } from "../registry/registry";
import * as crypto from "../crypto"

export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

let lastReceivedMessage:string | null = null
let lastSentMessage:string | null = null
let lastCircuit: Node[] = []

export async function user(userId: number) {
  const _user = express();
  _user.use(express.json());
  _user.use(bodyParser.json());

  // TODO implement the status route
  _user.get("/status", (req, res) => {
    res.send("live")
  });

  _user.get("/getLastReceivedMessage", (req, res)=>{
    res.status(200).json({result: lastReceivedMessage})
  })

  _user.get("/getLastSentMessage", (req, res)=>{
    res.status(200).json({result:lastSentMessage})
  })

  _user.post("/message", (req, res) => {
    const { message } = req.body as { message:string }
    lastReceivedMessage = message
    res.status(200)
  })

  _user.post("/sendMessage", async (req, res) => {
    const {message, destinationUserId} = req.body
    let circuit: Node[] = []
    const nodes = await fetch(`http://localhost:${REGISTRY_PORT}/getNodeRegistry`)
      .then(res => res.json() as Promise<GetNodeRegistryBody>)
      .then(body => body.nodes)
    while (circuit.length<3) {
      const randomNode = nodes[Math.floor(Math.random()*nodes.length)]
      if (!circuit.includes(randomNode)) circuit.push(randomNode)
    }
    lastSentMessage = message
    let destination = `${REGISTRY_PORT+destinationUserId}`.padStart(10, "0")
    let messageToSend = message
    for (const node of circuit) {
      const symKey = await crypto.createRandomSymmetricKey()
      const messageToEncrypt = `${destination + messageToSend}`;
      destination = `${BASE_ONION_ROUTER_PORT + node.nodeId}`.padStart(10, "0");
      const encMessage = await crypto.symEncrypt(symKey, `${destination + lastSentMessage}`)
      const strSymKey = await await crypto.exportSymKey(symKey)
      const encSymKey = await crypto.rsaEncrypt(strSymKey, node.pubKey)
      messageToSend = encSymKey + encMessage
    }

    circuit.reverse()
    lastCircuit = circuit
    await fetch(`http://localhost:${BASE_ONION_ROUTER_PORT+circuit[0].nodeId}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: messageToSend
      })
    })

    res.status(200).send("Message sent")
  })

  /*
  // Generates a pair of private / public RSA keys
  generateRsaKeyPair(): Promise<GenerateRsaKeyPair>

  // Export a crypto public key to a base64 string format
  exportPubKey(key: webcrypto.CryptoKey): Promise<string>

  // Export a crypto private key to a base64 string format
  exportPrvKey(key: webcrypto.CryptoKey | null): Promise<string | null>

  // Import a base64 string public key to its native format
  importPubKey(strKey: string): Promise<webcrypto.CryptoKey>

  // Import a base64 string private key to its native format
  importPrvKey(strKey: string): Promise<webcrypto.CryptoKey>

  // Encrypt a message using an RSA public key
  rsaEncrypt(b64Data: string, strPublicKey: string): Promise<string>

  // Decrypts a message using an RSA private key
  rsaDecrypt(data: string, privateKey: webcrypto.CryptoKey): Promise<string>

  // Generates a random symmetric key
  createRandomSymmetricKey(): Promise<webcrypto.CryptoKey>

  // Export a crypto symmetric key to a base64 string format
  exportSymKey(key: webcrypto.CryptoKey): Promise<string>

  // Import a base64 string format to its crypto native format
  importSymKey(strKey: string): Promise<webcrypto.CryptoKey>

  // Encrypt a message using a symmetric key
  symEncrypt(key: webcrypto.CryptoKey, data: string): Promise<string>

  // Decrypt a message using a symmetric key
  symDecrypt(strKey: string, encryptedData: string): Promise<string>
  */


  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(
      `User ${userId} is listening on port ${BASE_USER_PORT + userId}`
    );
  });

  return server;
}
