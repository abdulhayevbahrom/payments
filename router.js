// router.js
import express from "express";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { getTelegramUser } from "./controller/getTelegramUser.controller.js";
import { buyServiceTransaction } from "./controller/fragment.controller.js";
import { STAR_PRICES, PREMIUM_PRICES }from './utils/prices.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

/* ============================================================
   PAYNET JSON-RPC
============================================================ */
router.post("/paynet", async (req, res) => {
  const { id, method, params } = req.body;

  try {
    if (!method) {
      return res.json({
        jsonrpc: "2.0",
        id: id || null,
        error: {
          code: -32600,
          message: "Method ko‘rsatilmagan",
          data: { receivedBody: req.body }
        },
      });
    }

    switch (method) {
      case "GetInformation": {
        if (!params?.fields?.mlbb_id || !params?.fields?.zone_id) {
          return res.json({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32602,
              message: "Majburiy parametrlar yo‘q",
              data: { requiredFields: ["mlbb_id", "zone_id"], received: params?.fields || {} }
            },
          });
        }

        // Agar mijoz topilmasa (hozircha false)
        if (false) {
          return res.json({
            jsonrpc: "2.0",
            id,
            error: {
              code: 302,
              message: "Клиент не найден",
              data: { mlbb_id: params.fields.mlbb_id, zone_id: params.fields.zone_id }
            },
          });
        }

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            status: "0",
            timestamp: dayjs().tz("Asia/Tashkent").format("YYYY-MM-DD HH:mm:ss"),
            fields: { amount: 58000 }
          },
        });
      }

      default:
        return res.json({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32601,
            message: "So‘ralgan metod topilmadi",
            data: { requestedMethod: method }
          },
        });
    }
  } catch (err) {
    console.error("Tizim xatosi:", err);
    return res.json({
      jsonrpc: "2.0",
      id: id || null,
      error: {
        code: -32603,
        message: "Tizim xatosi",
        data: { errorMessage: err.message, stack: err.stack }
      },
    });
  }
});

/* ============================================================
   TELEGRAM USER INFORMATION
============================================================ */
router.get("/telegram-user/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const result = await getTelegramUser(username);

    if (result.success) {
      return res.json({ success: true, data: result });
    } else {
      return res.status(404).json({
        success: false,
        error: {
          code: 404,
          message: "Foydalanuvchi topilmadi",
          data: { username }
        },
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: "Server xatosi",
        data: { errorMessage: err.message, stack: err.stack }
      },
    });
  }
});

/* ============================================================
   PRICE CALCULATOR (stars & premium)
============================================================ */
// =========================
// Price Calculation API (User info bilan)
// =========================
router.post("/calculate-price", async (req, res) => {
  const { username, productType, amount } = req.body;

  if (!username || !productType || !amount) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: "Parametrlar kerak: username, productType, amount",
        data: { receivedBody: req.body }
      },
    });
  }

  // 1) Avval telegram user ma’lumotlarini olish
  const userInfo = await getTelegramUser(username);

  if (!userInfo.success) {
    return res.status(404).json({
      success: false,
      error: {
        code: 404,
        message: "Foydalanuvchi topilmadi",
        data: { username }
      }
    });
  }

  try {
    let priceSUM = null;

    if (productType === "star") {
      priceSUM = STAR_PRICES[amount];
    } else if (productType === "premium") {
      priceSUM = PREMIUM_PRICES[amount];
    }

    if (!priceSUM) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: "Noto‘g‘ri amount yoki productType",
        }
      });
    }

    return res.json({
      success: true,
      user: userInfo,     // 👈 User ma’lumotlari qo‘shildi
      data: {
        productType,
        amount,
        priceSUM
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { message: err.message }
    });
  }
});

/* ============================================================
   BUY SERVICE (final purchase)
============================================================ */
router.post("/buy-service", async (req, res) => {
  const { username, productType, amount, priceSUM } = req.body;

  if (!username || !productType || !amount || !priceSUM) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: "Barcha parametrlar kerak: username, productType, amount, priceSUM",
        data: { receivedBody: req.body }
      },
    });
  }

  try {
    const result = await buyServiceTransaction({ username, productType, amount, priceSUM });

    if (result.success) {
      return res.json({ success: true, message: result.message, data: result.data });
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: result.message || "Xatolik yuz berdi",
          data: result.error || null
        },
      });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: "Server xatosi",
        data: { errorMessage: err.message, stack: err.stack }
      },
    });
  }
});

export default router;









// // import express from "express";
// // import dayjs from "dayjs";
// // import utc from "dayjs/plugin/utc.js";
// // import timezone from "dayjs/plugin/timezone.js";

// // dayjs.extend(utc);
// // dayjs.extend(timezone);

// // const router = express.Router();

// // router.post("/paynet", async (req, res) => {
// //   const { id, method, params } = req.body;

// //   try {
// //     if (!method) {
// //       return res.json({
// //         jsonrpc: "2.0",
// //         id: id || null,
// //         error: { code: -32600, message: "Method ko‘rsatilmagan" },
// //       });
// //     }

// //     switch (method) {
// //       case "GetInformation": {
// //         if (!params?.fields?.order_id) {
// //           return res.json({
// //             jsonrpc: "2.0",
// //             id,
// //             error: { code: -32602, message: "Majburiy parametrlar yo‘q" },
// //           });
// //         }

// //         let order_id = params.fields.order_id;

// //         if (false) {
// //           return res.json({
// //             jsonrpc: "2.0",
// //             id,
// //             error: {
// //               code: 302,
// //               message: "Клиент не найден",
// //             },
// //           });
// //         }

// //         return res.json({
// //           jsonrpc: "2.0",
// //           id,
// //           result: {
// //             status: "0",
// //             timestamp: dayjs()
// //               .tz("Asia/Tashkent")
// //               .format("YYYY-MM-DD HH:mm:ss"),
// //             fields: {
// //               amount: 58000,
// //             },
// //           },
// //         });
// //       }

// //       // === PERFORM TRANSACTION ===
// //       // case "PerformTransaction": {
// //       //   if (!params?.fields?.order_id || !params?.amount) {
// //       //     return res.json({
// //       //       jsonrpc: "2.0",
// //       //       id,
// //       //       error: { code: -32602, message: "Majburiy parametrlar yo‘q" },
// //       //     });
// //       //   }

// //       //   const exactUser = await Payment.findOne({
// //       //     order_id: params.fields.order_id,
// //       //     status: false,
// //       //   });

// //       //   if (!exactUser) {
// //       //     return res.json({
// //       //       jsonrpc: "2.0",
// //       //       id,
// //       //       error: {
// //       //         code: 201,
// //       //         message: "Транзакция уже существует",
// //       //       },
// //       //     });
// //       //   }

// //       //   // Tiyinni so‘mga aylantirish
// //       //   const amountInUzs = params.amount / 100;

// //       //   if (exactUser.amount !== amountInUzs) {
// //       //     return res.json({
// //       //       jsonrpc: "2.0",
// //       //       id,
// //       //       error: { code: 413, message: "Неверная сумма" },
// //       //     });
// //       //   }

// //       //   const existing = await Payment.findOne({
// //       //     transactionId: params.transactionId,
// //       //   });

// //       //   if (existing) {
// //       //     return res.json({
// //       //       jsonrpc: "2.0",
// //       //       id,
// //       //       error: {
// //       //         code: 201,
// //       //         message: "Транзакция уже существует",
// //       //       },
// //       //     });
// //       //   }

// //       //   exactUser.status = true;
// //       //   exactUser.transactionId = params.transactionId;
// //       //   await exactUser.save();

// //       //   return res.json({
// //       //     jsonrpc: "2.0",
// //       //     id,
// //       //     result: {
// //       //       timestamp: dayjs()
// //       //         .tz("Asia/Tashkent")
// //       //         .format("YYYY-MM-DD HH:mm:ss"),
// //       //       providerTrnId: exactUser._id,
// //       //       fields: {
// //       //         message: "To‘lov muvaffaqiyatli amalga oshirildi",
// //       //       },
// //       //     },
// //       //   });
// //       // }

// //       // case "CheckTransaction": {
// //       //   const transaction = await Payment.findOne({
// //       //     transactionId: params.transactionId,
// //       //   });

// //       //   if (!transaction) {
// //       //     return res.json({
// //       //       jsonrpc: "2.0",
// //       //       id,
// //       //       error: { code: 203, message: "Transakziya topilmadi" },
// //       //     });
// //       //   }

// //       //   return res.json({
// //       //     jsonrpc: "2.0",
// //       //     id,
// //       //     result: {
// //       //       transactionState: transaction.status ? 1 : 2,
// //       //       timestamp: dayjs(transaction.updatedAt)
// //       //         .tz("Asia/Tashkent")
// //       //         .format("YYYY-MM-DD HH:mm:ss"),
// //       //       providerTrnId: transaction._id,
// //       //     },
// //       //   });
// //       // }

// //       // case "GetStatement": {
// //       //   const { dateFrom, dateTo } = params;
// //       //   const transactions = await Payment.find({
// //       //     status: true,
// //       //     createdAt: {
// //       //       $gte: new Date(dateFrom),
// //       //       $lte: new Date(dateTo),
// //       //     },
// //       //   });

// //       //   return res.json({
// //       //     jsonrpc: "2.0",
// //       //     id,
// //       //     result: {
// //       //       statements: transactions.map((item) => ({
// //       //         transactionId: item.transactionId,
// //       //         amount: item.amount * 100,
// //       //         providerTrnId: item._id,
// //       //         timestamp: dayjs(item.updatedAt)
// //       //           .tz("Asia/Tashkent")
// //       //           .format("YYYY-MM-DD HH:mm:ss"),
// //       //         // providerTrnId: transactions._id,
// //       //       })),
// //       //     },
// //       //   });
// //       // }
// //       default:
// //         return res.json({
// //           jsonrpc: "2.0",
// //           id,
// //           error: { code: -32601, message: "So‘ralgan metod topilmadi" },
// //         });
// //     }
// //   } catch (err) {
// //     console.log(">>>>>>>>>>>>>>", err);
// //     return res.json({
// //       jsonrpc: "2.0",
// //       id: id || null,
// //       error: { code: -32603, message: "Tizim xatosi", err },
// //     });
// //   }
// // });

// // // module.exports = router;
// // export default router;

// import express from "express";
// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc.js";
// import timezone from "dayjs/plugin/timezone.js";

// dayjs.extend(utc);
// dayjs.extend(timezone);

// const router = express.Router();

// router.post("/paynet", async (req, res) => {
//   const { id, method, params } = req.body;

//   try {
//     if (!method) {
//       return res.json({
//         jsonrpc: "2.0",
//         id: id || null,
//         error: { code: -32600, message: "Method ko‘rsatilmagan" },
//       });
//     }

//     switch (method) {
//       case "GetInformation": {
//         if (!params?.fields?.mlbb_id || !params?.fields?.zone_id) {
//           return res.json({
//             jsonrpc: "2.0",
//             id,
//             error: { code: -32602, message: "Majburiy parametrlar yo‘q" },
//           });
//         }

        

//         // Agar mijoz mavjud bo‘lmasa (hozircha false)
//         if (false) {
//           return res.json({
//             jsonrpc: "2.0",
//             id,
//             error: {
//               code: 302,
//               message: "Клиент не найден",
//             },
//           });
//         }

//         return res.json({
//           jsonrpc: "2.0",
//           id,
//           result: {
//             status: "0",
//             timestamp: dayjs()
//               .tz("Asia/Tashkent")
//               .format("YYYY-MM-DD HH:mm:ss"),
//             fields: {
//               amount: 58000,
//             },
//           },
//         });
//       }

//       // ============================================
//       //   Boshqa metodlar komentda — ishlamaydi
//       // ============================================

//       /*
//       case "PerformTransaction": {
//         ...
//       }

//       case "CheckTransaction": {
//         ...
//       }

//       case "GetStatement": {
//         ...
//       }
//       */

//       // Default
//       default:
//         return res.json({
//           jsonrpc: "2.0",
//           id,
//           error: { code: -32601, message: "So‘ralgan metod topilmadi" },
//         });
//     }
//   } catch (err) {
//     console.log("Xatolik:", err);
//     return res.json({
//       jsonrpc: "2.0",
//       id: id || null,
//       error: { code: -32603, message: "Tizim xatosi" },
//     });
//   }
// });

// export default router;
