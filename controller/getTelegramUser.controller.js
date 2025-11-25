import fetch from "node-fetch";


export async function getTelegramUser(username) {

    const url = `${process.env.API_BASE}/star/recipient/search?username=${username}&quantity=50`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "API-Key": process.env.API_KEY
            }
        });

        const data = await response.json();

        // Agar foydalanuvchi topilsa
        if (data.success) {
            return {
                success: true,
                recipient_hash: data.recipient || null,
                name: data.name || null,
                photo: data.photo || null,
                myself: data.myself || false,
                username: data.username || username,
                quantity_requested: data.quantity || 50
            };
        }
        // Topilmasa
        else {
            return {
                success: false,
                message: "user not found"
            };
        }

    } catch (err) {
        return {
            success: false,
            message: "error",
            error: err.message
        };
    }
}
