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

export async function launchRegistry() {
  const _registry = express();
  _registry.use(express.json());
  _registry.use(bodyParser.json());
  let registeredNodes: GetNodeRegistryBody = { nodes: [] }

  // TODO implement the status route
  _registry.get("/status", (req, res) => {
    res.send("live")
  });

  _registry.post("/registerNode", (req, res) => {
    const { nodeId, pubKey} = req.body
    if (!nodeId || !pubKey) {
      res.status(400).json({ error: "Node ID and Public Key are required." })
    } else if (registeredNodes.nodes.some(n => n.nodeId === nodeId || n.pubKey === pubKey)) {
      res.send("Node ID or public key already in use")
    } else {
      const newNode: Node = {nodeId, pubKey};
      registeredNodes.nodes.push(newNode);
      res.status(200).json({ result: "Node registered successfully." })
    }
  })

  _registry.get("/getPrivateKey", (req, res) => {


    res.send({result:""})
  })

  _registry.get("/getNodeRegistry", (req, res) => {
    res.status(200).json(registeredNodes)
  })

  

  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}
