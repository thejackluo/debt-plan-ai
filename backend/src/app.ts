import cors from "cors";
import express from "express";

import healthRouter from "./api/healthRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? "*",
    methods: ["GET", "POST", "DELETE"],
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "CollectWise Backend",
    version: "0.1.0",
    status: "online",
  });
});

app.use("/api", healthRouter);

export default app;
