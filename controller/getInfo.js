import axios from "axios";
import crypto from "crypto";

// Smile.One dan olgan ma'lumotlaringizni .env ga yozing
const API_KEY = process.env.SMILE_ONE_API_KEY; // masalan: sk_live_xxxxxx
const SECRET_KEY = process.env.SMILE_ONE_SECRET; // masalan: ssecret_xxxxxx
const BASE_URL = "https://api.smile.one/v1";

// Signature yaratish funksiyasi (Smile.One talab qiladi)
function generateSignature(params) {
  const sortedKeys = Object.keys(params).sort();
  let str = "";
  for (const key of sortedKeys) {
    if (
      params[key] !== "" &&
      params[key] !== null &&
      params[key] !== undefined
    ) {
      str += `${key}=${params[key]}&`;
    }
  }
  str = str.slice(0, -1); // oxirgi & ni olib tashlaymiz
  str += SECRET_KEY;
  return crypto.createHash("sha256").update(str).digest("hex");
}

// Yordamchi funksiya: Zone ID bo'yicha server nomi (MLBB uchun)
function getZoneName(zoneId) {
  const zones = {
    1001: "Indonesia",
    2000: "Global (SEA)",
    8001: "US",
    8002: "Europe",
    8003: "Japan",
    8004: "Korea",
    // To'liq ro'yxat uchun MLBB docs'dan qo'shing
  };
  return zones[zoneId] || `Zone ${zoneId}`;
}

const getInfo = async () => {
  try {
    const userId = "1687975450";
    const zoneId = "18159";

    const params = {
      apiKey: API_KEY,
      productId: "ml_86", // Standart MLBB productId (86 - 257 diamonds, o'zgartirishingiz mumkin)
      userId: userId.toString(),
      zoneId: zoneId.toString(),
      timestamp: Date.now(),
    };

    params.signature = generateSignature(params);

    let playerInfo = {};

    try {
      // 1-qadam: Smile.One orqali points check (profil ma'lumotlari qaytishi mumkin)
      const smileResponse = await axios.post(`${BASE_URL}/order/check`, params);

      if (smileResponse.data.status === 200) {
        // Response'da player_name yoki username bo'lsa, oling
        playerInfo = {
          username:
            smileResponse.data.player_name ||
            smileResponse.data.username ||
            "Noma'lum",
          currentDiamonds: smileResponse.data.points || 0,
          source: "Smile.One",
        };
      }
    } catch (smileError) {
      console.log(
        "Smile.One xato:",
        smileError.response?.data || smileError.message
      );
    }

    // 2-qadam: Agar Smile.One'dan username kelmasa, MLBB unofficial API'dan oling (free, lekin rate limit bor)
    if (!playerInfo.username || playerInfo.username === "Noma'lum") {
      try {
        // MLBB API (unofficial, lekin ishonchli: https://mlbb-data.vercel.app/api/player/{userId})
        // Yoki boshqa: https://mobile-legends-api.herokuapp.com/player/{userId}
        const mlbbResponse = await axios.get(
          `https://mlbb-data.vercel.app/api/player/${userId}`
        );

        if (mlbbResponse.data && mlbbResponse.data.name) {
          playerInfo = {
            ...playerInfo,
            username: mlbbResponse.data.name, // Profile name/username
            heroName: mlbbResponse.data.heroName || null, // Agar main hero bo'lsa
            rank: mlbbResponse.data.rank || "Noma'lum",
            source: "MLBB API",
          };
        } else {
          playerInfo.username = "Profil topilmadi";
        }
      } catch (mlbbError) {
        console.log(
          "MLBB API xato:",
          mlbbError.response?.data || mlbbError.message
        );
        playerInfo.username = "API xatosi – qo'lda tekshiring";
      }
    }

    // Zone ID haqida qo'shimcha info (MLBB server nomi)
    const zoneInfo = getZoneName(zoneId); // Quyida funksiya
    playerInfo.zoneName = zoneInfo;

    console.log(playerInfo);
  } catch (err) {
    console.log("Xatolik:", err.message);
    return null;
  }
};

getInfo();
