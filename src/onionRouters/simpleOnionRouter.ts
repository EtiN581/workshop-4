import bodyParser from "body-parser";
import express from "express";
import { BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from "../config";
import { generateKeyPair } from "crypto";
import { generateRsaKeyPair, exportPrvKey, exportPubKey, rsaDecrypt, importPrvKey, symDecrypt } from "../crypto";


export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());
  let lastReceivedEncryptedMessage: string | null = null
  let lastReceivedDecryptedMessage: string | null = null
  let lastMessageDestination: number | null = null

  const {publicKey, privateKey} = await generateRsaKeyPair()
  const prvKey = await exportPrvKey(privateKey);
  const pubKey = await exportPubKey(publicKey);

  // TODO implement the status route
  onionRouter.get("/status", (req, res) => {
    res.send("live")
  });

  onionRouter.get("/getLastReceivedEncryptedMessage", (req, res)=>{
    res.json({
      result:lastReceivedEncryptedMessage
    })
  })

  onionRouter.get("/getLastReceivedDecryptedMessage", (req, res)=>{
    res.json({
      result:lastReceivedDecryptedMessage
    })
  })

  onionRouter.get("/getLastMessageDestination", (req, res)=>{
    res.json({
      result:lastMessageDestination
    })
  })

  onionRouter.get("/getPrivateKey", (req, res)=>{
    res.json({result: prvKey})
  })

  onionRouter.post("/message", async (req, res)=>{
    const {message} = req.body
    const symKey = await rsaDecrypt(message.slice(0, 344), privateKey)
    const newMessage = await symDecrypt(symKey, message.slice(344))
    lastReceivedEncryptedMessage = message
    lastReceivedDecryptedMessage = newMessage.slice(10)
    const next = parseInt(newMessage.slice(0, 10), 10)
    await fetch(`http://localhost:${next}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: newMessage
      })
    })
    res.send("success")
  })

  await fetch(`http://localhost:${REGISTRY_PORT}/registerNode`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nodeId: nodeId,
      pubKey: pubKey,
    })
  });

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${
        BASE_ONION_ROUTER_PORT + nodeId
      }`
    );
  });

  return server;
}
