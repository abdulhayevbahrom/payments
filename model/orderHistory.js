// models/TransactionHistory.js
import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            index: true, // tez qidirish uchun
        },

        productType: {
            type: String,
            // enum: ["premium", "stars"],
            required: true,
        },

        // premium oy soni yoki stars miqdori
        amount: {
            type: Number,
            required: true,
            min: 1,
        },

        // UZS summasi (faqat tarix uchun)
        priceSUM: {
            type: Number,
            required: true,
            min: 0,
        },

        // xarid qilish uchun TON miqdori
        ton: {
            type: Number,
            // required: true,
            min: 0,
        },

        // TON blockchain tranzaksiya ID
        tonTxId: {
            type: String,
            default: null,
        },

        // fragment API javobi
        fragmentTx: {
            type: Object,
            default: {},
        },

        status: {
            type: String,
            enum: ["success", "error"],
            default: "success",
        },

        errorMessage: {
            type: String,
            default: null,
        },
    },

    {
        timestamps: true, // createdAt, updatedAt avtomatik
    }
);

// Tez-tez qidiriladigan maydonlar uchun indekslar
schema.index({ username: 1, createdAt: -1 });
schema.index({ status: 1 });
schema.index({ productType: 1 });

export default mongoose.model("TransactionHistory", schema);
