import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
// import TransactionHistory from "../model/orderHistory.js";

export async function buyServiceTransaction({ username, productType, amount, priceSUM }) {
    try {
        // console.log({ username, productType, amount, priceSUM });
        const tonkiper = await axios.get(
            process.env.TON_API_URL,
            {},
            {
                headers: {
                    Authorization: `Bearer ${process.env.TON_API_KEY}`
                }
            }
        );
        console.log(">>>", tonkiper);
    } catch (err) {
        console.error("Error initializing tonkiper:", err.message);
    }



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


