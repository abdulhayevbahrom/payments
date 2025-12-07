import mongoose from "mongoose";
import axios from "axios";
import Order from "../model/orderHistory.js";
import sendTON from "./sendTON.controller.js";

export async function buyServiceTransaction({ username, productType, amount, priceSUM }) {
    if (!username || !productType || !amount || !priceSUM) {
        return { success: false, message: "❗️ Ma'lumotlar yetarli emas" };
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let recipientHash, createUrl, payload;

        // ============================ STAR order ============================
        if (productType === "stars") {
            if (amount < 5) throw new Error("❗️ Stars minimal miqdori 5 ta bo‘lishi kerak");

            const search = await axios.get(`${process.env.API_BASE}/star/recipient/search`, {
                params: { username, quantity: amount },
                headers: { "API-Key": process.env.API_KEY }
            });

            recipientHash = search.data?.recipient;
            if (!recipientHash) throw new Error("❗️ Ushbu username uchun recipient topilmadi");

            createUrl = `${process.env.API_BASE}/orders/star`;
            payload = { username, recipient_hash: recipientHash, quantity: amount, wallet_type: "TON" };
        }

        // ============================ PREMIUM order ============================
        if (productType === "premium") {
            if (![3, 6, 12].includes(amount)) throw new Error("❗️ Premium faqat 3, 6 yoki 12 oylik bo‘ladi");

            const search = await axios.get(`${process.env.API_BASE}/premium/recipient/search`, {
                params: { username, months: amount },
                headers: { "API-Key": process.env.API_KEY }
            });

            recipientHash = search.data?.recipient;
            if (!recipientHash) throw new Error("❗️ Ushbu username uchun recipient topilmadi");

            createUrl = `${process.env.API_BASE}/orders/premium`;
            payload = { username, recipient_hash: recipientHash, months: amount, wallet_type: "TON" };
        }

        // ============================ Order yaratish ============================
        const orderRes = await axios.post(createUrl, payload, {
            headers: { "API-Key": process.env.API_KEY, "Content-Type": "application/json" }
        });

        if (!orderRes.data?.amountTON)
            throw new Error("❌ Order yaratildi, lekin amountTON topilmadi");

        // ============================ TON yuborish ============================
        const tonRes = await sendTON({
            toWallet: process.env.ADMIN_TON_WALLET,
            amountTON: orderRes.data.amountTON,
            comment: `Buyurtma: ${productType} | ${username}`
        });

        if (!tonRes.success)
            throw new Error("❌ TON to'lovi amalga oshmadi: " + JSON.stringify(tonRes.error));

        // ============================ MongoDB ga saqlash ============================
        const savedOrder = await Order.create([{
            username,
            productType,
            amount,
            priceSUM,
            orderId: orderRes.data?.order_id,
            fragmentTxId: orderRes.data?.fragment_tx_id || null,
            status: orderRes.data?.status || "pending",
            amountTON: orderRes.data.amountTON,
            tonkeeperTx: tonRes.data?.tx_id || null
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return {
            success: true,
            message: "✅ Buyurtma yaratildi va TON to‘lovi muvaffaqiyatli amalga oshirildi!",
            data: { fragment: orderRes.data, tonkeeper: tonRes.data, order: savedOrder[0] }
        };

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        return { success: false, message: "❌ Xatolik yuz berdi", error: err.response?.data || err.message };
    }
}


// import mongoose from "mongoose";
// import axios from "axios";
// import Order from "../model/orderHistory.js";

// export async function buyServiceTransaction({ username, productType, amount, priceSUM }) {
//     console.log({ username, productType, amount, priceSUM });

//     if (!username || !productType || !amount || !priceSUM) {
//         return { success: false, message: "❗️ Ma'lumotlar yetarli emas" };
//     }
//     if (productType === "stars" && amount < 5) {
//         return { success: false, message: "❗️ Stars minimal miqdori 5 ta bo'lishi kerak" };
//     }
//     const API_BASE = process.env.API_BASE;

//     const session = await mongoose.startSession();
//     session.startTransaction(); // MongoDB tranzaksiyasini boshlash

//     try {
//         let searchUrl = "";
//         let createUrl = "";
//         let payload = {};

//         // ======== PRODUCT LOGIC ========
//         if (productType === "stars") {
//             searchUrl = `${API_BASE}/star/recipient/search?username=${username}&quantity=${amount}`;
//             createUrl = `${API_BASE}/orders/star`;

//             const searchRes = await axios.get(searchUrl, {
//                 headers: { "API-Key": process.env.API_KEY }
//             });
//             const recipientHash = searchRes.data?.recipient;

//             if (!recipientHash) {
//                 throw new Error("❗️ Recipient topilmadi");
//             }

//             payload = {
//                 username,
//                 recipient_hash: recipientHash,
//                 quantity: amount,
//                 wallet_type: "TON"
//             };
//         } else if (productType === "premium") {
//             if (![3, 6, 12].includes(amount)) {
//                 throw new Error("❗️ Premium faqat 3,6,12 oy bo‘ladi");
//             }

//             searchUrl = `${API_BASE}/premium/recipient/search?username=${username}&months=${amount}`;
//             createUrl = `${API_BASE}/orders/premium`;

//             const searchRes = await axios.get(searchUrl, {
//                 headers: { "API-Key": process.env.API_KEY }
//             });
//             const recipientHash = searchRes.data?.recipient;

//             if (!recipientHash) {
//                 throw new Error("❗️ Recipient topilmadi");
//             }

//             payload = {
//                 username,
//                 recipient_hash: recipientHash,
//                 months: amount,
//                 wallet_type: "TON"
//             };
//         }

//         // ======== CREATE ORDER ========
//         const orderRes = await axios.post(createUrl, payload, {
//             headers: {
//                 "API-Key": process.env.API_KEY,
//                 "Content-Type": "application/json"
//             }
//         });

//         // ======== SAVE ORDER IN MONGO WITH TRANSACTION ========
//         const savedOrder = await Order.create([{
//             username,
//             productType,
//             amount,
//             priceSUM,
//             orderId: orderRes.data?.order_id,
//             fragmentTxId: orderRes.data?.fragment_tx_id || null,
//             status: orderRes.data?.status || "pending",
//             amountTON: orderRes.data?.amountTON || 0
//         }], { session });

//         // TRANSAKSIYANI TASDIQLASH
//         await session.commitTransaction();
//         session.endSession();

//         return {
//             success: true,
//             message: "✅ Buyurtma muvaffaqiyatli yaratildi!",
//             data: {
//                 api: orderRes.data,
//                 order: savedOrder[0]
//             }
//         };

//     } catch (err) {
//         await session.abortTransaction();
//         session.endSession();
//         return {
//             success: false,
//             message: "❌ Xatolik yuz berdi",
//             error: err.response?.data || err.message
//         };
//     }
// };



// ==============Stars=================
// {
//   "username": "Azimjon_M",
//   "productType": "stars",
//   "amount": 500,
//   "priceSUM": 120000
// }
// ==============Premium=================
// {
//   "username": "Azimjon_M",
//   "productType": "premium",
//   "amount": 6,
//   "priceSUM": 240000
// }

