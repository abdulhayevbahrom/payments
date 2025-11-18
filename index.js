import dotenv from "dotenv";
dotenv.config();

import express from "express";
import router from "./router.js";

const PORT = process.env.PORT || 8070;

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.send("Salom dunyo"));

app.use("/api", router);

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
