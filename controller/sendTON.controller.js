import axios from "axios";

async function sendTON({ toWallet, amountTON, comment }) {
    console.log({ toWallet, amountTON, comment });

    if (!toWallet || !amountTON) {
        return { success: false, error: "❌ ToWallet yoki amountTON berilmagan" };
    }

    try {
        const res = await axios.post(
            `${process.env.TONKIPER_API_URL}/transfer`,
            {
                to: toWallet,
                amount: amountTON,
                comment: comment || "Buyurtma to'lovi"
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.TONKIPER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return { success: true, data: res.data };
    } catch (err) {
        return { success: false, error: err.response?.data || err.message };
    }
}

export default sendTON;
