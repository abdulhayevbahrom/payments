import dotenv from "dotenv";
dotenv.config();

import express from "express";
import router from "./router.js";

import {
  getProductList,
  topupMobileLegends,
} from "./controller/smileoneService.js";

const PORT = process.env.PORT || 8070;

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.send("Salom dunyo"));
app.use("/api", router);

app.get("/api/ml/products", async (req, res) => {
  try {
    const data = await getProductList();
    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: "Product list olishda xatolik",
      error: String(e),
    });
  }
});

/**
 * Asosiy endpoint:
 * ML diamond sotib olish
 *
 * POST /api/ml/topup
 * body: { userId, zoneId, productId }
 */
app.post("/api/ml/topup", async (req, res) => {
  const { userId, zoneId, productId } = req.body;

  // Kerakli maydonlarni tekshiramiz
  if (!userId || !zoneId || !productId) {
    return res.status(400).json({
      success: false,
      message: "userId, zoneId va productId majburiy",
    });
  }

  try {
    // Top-up funksiyasini chaqiramiz
    const result = await topupMobileLegends({
      userid: String(userId),
      zoneid: String(zoneId),
      productid: String(productId),
    });

    // Role check yoki purchase xato bo'lsa
    if (!result.success) {
      return res.status(400).json({
        success: false,
        step: result.step,
        raw: result.raw,
      });
    }

    // Muvaffaqiyatli
    return res.json({
      success: true,
      message: "Diamond muvaffaqiyatli yuborildi!",
      order_id: result.order_id,
      role: result.role,
      raw: result.order,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: "Server xatosi",
      error: String(e),
    });
  }
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
