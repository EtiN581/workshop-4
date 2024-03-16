import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT, REGISTRY_PORT, BASE_ONION_ROUTER_PORT } from "../config";
import { Node, GetNodeRegistryBody } from "../registry/registry";
import * as crypto from "../crypto"

export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

export async function user(userId: number) {
  const _user = express();
  _user.use(express.json());
  _user.use(bodyParser.json());

  let lastReceivedMessage: string | null = null
  let lastSentMessage: string | null = null
  let lastCircuit: Node[] = []

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
    const { message } = req.body
    lastReceivedMessage = message
    res.status(200).send("success")
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
      const encMessage = await crypto.symEncrypt(symKey, `${destination + lastSentMessage}`)
      destination = `${BASE_ONION_ROUTER_PORT + node.nodeId}`.padStart(10, "0");
      const encSymKey = await crypto.rsaEncrypt(await crypto.exportSymKey(symKey), node.pubKey)
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


  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(
      `User ${userId} is listening on port ${BASE_USER_PORT + userId}`
    );
  });

  return server;
}
