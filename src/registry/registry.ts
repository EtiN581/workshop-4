import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";
import * as crypto from "../crypto"

export type Node = { nodeId: number; pubKey: string };

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Node[];
};

const registeredNodes: Node[] = [];

export async function launchRegistry() {
  const _registry = express();
  _registry.use(express.json());
  _registry.use(bodyParser.json());

  // TODO implement the status route
  _registry.get("/status", (req, res) => {
    res.send("live")
  });

  _registry.post("/registerNode", (req, res) => {
    const { nodeId, pubKey} = req.body as RegisterNodeBody
    if (!nodeId || !pubKey) {
      res.status(400).json({ error: "Node ID and Public Key are required." })
    } else {
      const newNode: Node = {nodeId, pubKey};
      registeredNodes.push(newNode);
      res.status(200).json({ message: "Node registered successfully." })
    }
  })

  _registry.get("/getPrivateKey", (req, res) => {


    res.send({result:""})
  })

  _registry.get("/getNodeRegistry", (req, res) => {
    const nodesJSON:any = []
    registeredNodes.forEach(node => {
      nodesJSON.push({
        nodeId: node.nodeId,
        pubKey: node.pubKey
      })
    })
    res.send({ nodes: nodesJSON})
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

  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}
