// index.js
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import router from "./router.js";


const PORT = process.env.PORT || 8070;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;

const app = express();

// =========================
// MongoDB ga ulanish
// =========================
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("🟢 MongoDB ulandi");
  } catch (error) {
    console.error("🔴 MongoDB xatolik:", error.message);
    process.exit(1); // Serverni to‘xtatish
  }
};

connectDB(); // Ma'lumotlar bazasiga ulanish

// =========================
// Middlewares
// =========================
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

// =========================
// Root route
// =========================
app.get("/", (req, res) => {
  res.send("Salom dunyo! TON Stars servisi ishlayapti.");
});

// =========================
// API router
// =========================
app.use("/api", router);

// =========================
// Health check
// =========================
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    port: PORT,
    wallet: process.env.TON_WALLET_ADDRESS || null,
  });
});

// =========================
// Server ishga tushishi
// =========================
app.listen(PORT, () => {
  console.log(`Server ishlayapti: http://localhost:${PORT}`);
});
