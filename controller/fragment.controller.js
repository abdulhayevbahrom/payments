import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
// import TransactionHistory from "../model/orderHistory.js";

export function buyServiceTransaction({
  username,
  productType,
  amount,
  priceSUM,
}) {
  const tonkiper = axios.get(
    process.env.TON_API_URL,
    {},
    {
      headers: {
        Authorization: `Bearer ${process.env.TON_API_KEY}`,
      },
    }
  );

  return tonkiper;

  // 2. Fragment API config
  // const fragment = axios.post({
  //     baseURL: process.env.API_BASE,
  //     headers: { "X-API-KEY": process.env.FRAGMENT_API_KEY }
  // });

  // const fragment = axios.post({
  //     baseURL: process.env.FRAGMENT_API_BASE,
  //     headers: { "X-API-KEY": process.env.FRAGMENT_API_KEY }
  // });

  // let tonPaymentTx = null;
  // let fragmentTx = null;

  // async function convertToTON(productType, amount) {
  //     if (productType === "premium") {
  //         return amount * 0.2;  // masalan 1 oy = 0.2 TON
  //     }
  //     if (productType === "stars") {
  //         return amount * 0.05; // masalan 1 star = 0.05 TON
  //     }
  //     throw new Error("Unknown product type");
  // }

  // try {
  //     // ⭐ STEP 1 — Avtomatik TON yechish
  //     const tonAmount = await convertToTON(productType, amount);  // ← narxlarni o'zingiz belgilaysiz

  //     const tonRes = await tonkiper("/wallet/send", {
  //         to: process.env.ADMIN_WALLET,
  //         amount: tonAmount,
  //         message: `Payment for ${productType} x${amount}`
  //     });

  //     if (!tonRes.data.success) {
  //         throw new Error("TON yechishda xatolik");
  //     }

  //     tonPaymentTx = tonRes.data.txid; // rollback uchun saqlaymiz

  //     // ⭐ STEP 2 — Fragment orqali Premium yoki Stars sotib olish
  //     if (productType === "premium") {
  //         fragmentTx = await fragment.post("/premium/buy", {
  //             username,
  //             months: amount
  //         });
  //     }

  //     if (productType === "stars") {
  //         fragmentTx = await fragment.post("/stars/buy", {
  //             username,
  //             count: amount
  //         });
  //     }

  //     if (!fragmentTx.data.success) {
  //         throw new Error("Fragment API purchase failed");
  //     }

  //     // ⭐ STEP 3 — MONGODBga yozish
  //     // const history = await TransactionHistory.create({
  //     //     username,
  //     //     productType,
  //     //     amount,
  //     //     priceSUM,
  //     //     ton: tonAmount,
  //     //     tonTxId: tonPaymentTx,
  //     //     fragmentTx: fragmentTx.data,
  //     //     status: "success",
  //     //     createdAt: new Date()
  //     // });

  //     return {
  //         success: true,
  //         message: "Xarid muvaffaqiyatli amalga oshdi",
  //         data: history
  //     };

  // } catch (error) {
  //     console.log("❌ ERROR:", error.message);

  //     // -------- ROLLBACK --------
  //     if (tonPaymentTx) {
  //         try {
  //             await tonkiper.post("/wallet/refund", {
  //                 txid: tonPaymentTx
  //             });
  //         } catch (e) {
  //             console.log("⚠ TON rollback amalga oshmadi!");
  //         }
  //     }

  //     // await TransactionHistory.create({
  //     //     username,
  //     //     productType,
  //     //     amount,
  //     //     priceSUM,
  //     //     status: "error",
  //     //     errorMessage: error.message,
  //     //     createdAt: new Date()
  //     // });

  //     return {
  //         success: false,
  //         message: "Xarid bajarilmadi",
  //         error: error.message
  //     };
  // }
}

// import axios from "axios";
// import dotenv from "dotenv";
// dotenv.config();
// // import TransactionHistory from "../model/orderHistory.js";

// // TON konvertatsiya funksiyasi
// async function convertToTON(productType, amount) {
//   if (productType === "premium") {
//     return amount * 0.2; // misol uchun
//   }
//   if (productType === "stars") {
//     return amount * 0.05; // misol uchun
//   }
//   throw new Error("Unknown product type");
// }

// export async function buyServiceTransaction({
//   username,
//   productType,
//   amount,
//   priceSUM,
// }) {
//   let tonPaymentTx = null;
//   let fragmentTx = null;

//   try {
//     // Debug uchun: TON API URL ni ko'rish
//     console.log("TON_API_URL:", process.env.TON_API_URL);

//     const tonAmount = await convertToTON(productType, amount);

//     // 👉 TON API ga to'g'ridan-to'g'ri POST (URL allaqachon full endpoint deb hisoblaymiz)
//     const tonRes = await axios.post(
//       process.env.TON_API_URL,
//       {
//         to: process.env.ADMIN_WALLET,
//         amount: tonAmount,
//         message: `Payment for ${productType} x${amount} (user: ${username})`,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.TON_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("TON RESPONSE:", tonRes.data);

//     if (!tonRes.data || !tonRes.data.success) {
//       throw new Error("TON yechishda xatolik");
//     }

//     tonPaymentTx = tonRes.data.txid;

//     // 👉 Fragment bilan ishlash
//     if (productType === "premium") {
//       fragmentTx = await axios.post(
//         `${process.env.FRAGMENT_API_BASE}/premium/buy`,
//         { username, months: amount },
//         {
//           headers: {
//             "X-API-KEY": process.env.FRAGMENT_API_KEY,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//     } else if (productType === "stars") {
//       fragmentTx = await axios.post(
//         `${process.env.FRAGMENT_API_BASE}/stars/buy`,
//         { username, count: amount },
//         {
//           headers: {
//             "X-API-KEY": process.env.FRAGMENT_API_KEY,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//     } else {
//       throw new Error("Noto'g'ri productType");
//     }

//     console.log("FRAGMENT RESPONSE:", fragmentTx.data);

//     if (!fragmentTx.data || !fragmentTx.data.success) {
//       throw new Error("Fragment API purchase failed");
//     }

//     const history = {
//       username,
//       productType,
//       amount,
//       priceSUM,
//       ton: tonAmount,
//       tonTxId: tonPaymentTx,
//       fragmentTx: fragmentTx.data,
//       status: "success",
//       createdAt: new Date(),
//     };

//     // await TransactionHistory.create(history);

//     return {
//       success: true,
//       message: "Xarid muvaffaqiyatli amalga oshdi",
//       data: history,
//     };
//   } catch (error) {
//     // xatoni to'liq ko'rish uchun
//     console.error("❌ ERROR buyServiceTransaction:", {
//       message: error.message,
//       status: error.response?.status,
//       data: error.response?.data,
//     });

//     // ROLLBACK
//     if (tonPaymentTx) {
//       try {
//         await axios.post(
//           process.env.TON_REFUND_URL || process.env.TON_API_URL_REFUND,
//           { txid: tonPaymentTx },
//           {
//             headers: {
//               Authorization: `Bearer ${process.env.TON_API_KEY}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );
//       } catch (e) {
//         console.error("⚠ TON rollback amalga oshmadi!", {
//           message: e.message,
//           status: e.response?.status,
//           data: e.response?.data,
//         });
//       }
//     }

//     // await TransactionHistory.create({
//     //   username,
//     //   productType,
//     //   amount,
//     //   priceSUM,
//     //   status: "error",
//     //   errorMessage: error.message,
//     //   createdAt: new Date(),
//     // });

//     return {
//       success: false,
//       message: "Xarid bajarilmadi",
//       error: error.message,
//     };
//   }
// }
