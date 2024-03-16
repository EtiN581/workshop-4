import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";

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
  let getNodeRegistryBody: GetNodeRegistryBody = { nodes: [] }

  // TODO implement the status route
  _registry.get("/status", (req, res) => {
    res.send("live")
  });

  _registry.post("/registerNode", (req, res) => {
    const { nodeId, pubKey} = req.body
    if (getNodeRegistryBody.nodes.some(n => n.nodeId === nodeId || n.pubKey === pubKey)) {
      res.status(400).send("Node ID or public key already in use")
    } else {
      getNodeRegistryBody.nodes.push({ nodeId, pubKey })
      res.status(200).json({ result: "Node registered successfully." })
    }
  })

  _registry.get("/getNodeRegistry", (req, res) => {
    res.status(200).json(getNodeRegistryBody)
  })  

  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}
