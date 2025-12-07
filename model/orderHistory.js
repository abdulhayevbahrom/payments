import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    username: { type: String, required: true },
    amount: { type: Number, required: true },          // Stars soni yoki Premium oylar soni
    productType: { type: String, enum: ["stars", "premium"], required: true },
    priceSUM: { type: String, required: true },       // So‘mdagi summa
    orderId: { type: String, required: true },        // iStar API order ID
    fragmentTxId: { type: String },                   // to‘lov transaction ID
    status: { type: String, default: "success" },
    amountTON: { type: Number },                      // ✅ Ishlatilgan TON miqdori
}, { timestamps: true });

const Order = mongoose.model("OrderHistory", orderSchema);
export default Order;