import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import crypto from "crypto";
import qs from "qs";

// ENV dan o'qib olamiz
const BASE_URL = process.env.SMILEONE_BASE_URL;
const UID = process.env.SMILEONE_UID;
const EMAIL = process.env.SMILEONE_EMAIL;
const SECRET_KEY = process.env.SMILEONE_KEY;
const PRODUCT_NAME = process.env.SMILEONE_PRODUCT || "mobilelegends";

/**
 * MD5 hash funksiyasi
 * Smile One sign yaratishda MD5 ikki marta ishlatiladi
 */
function md5(str) {
  return crypto.createHash("md5").update(str, "utf8").digest("hex");
}

/**
 * Smile One sign generatsiya qilish qoidasi:
 * 1) Parametrlarni alfavit tartibida sort qilamiz
 * 2) k=v&k=v&... formatida string yasaymiz
 * 3) oxiriga secret key qo'shamiz
 * 4) MD5 → MD5
 */
function buildSign(params) {
  const sortedKeys = Object.keys(params).sort();
  let str = "";

  for (const key of sortedKeys) {
    const value = params[key];

    // bo'sh qiymatlar sign ichiga kiritilmaydi
    if (value === undefined || value === null || value === "") continue;

    str += `${key}=${value}&`;
  }

  // oxiriga secret key qo'shamiz
  str += SECRET_KEY;

  // double md5
  return md5(md5(str));
}

/**
 * Smile One API'ga POST yuboruvchi umumiy funksiya
 * Bunda biz query string formatida uzatamiz: application/x-www-form-urlencoded
 */
async function smilePost(path, extraParams) {
  const time = Math.floor(Date.now() / 1000); // UNIX time (sekundlarda)

  // API ga yuboriladigan umumiy parametrlar
  const baseParams = {
    uid: UID,
    email: EMAIL,
    time,
    ...extraParams,
  };

  // sign yasash
  const sign = buildSign(baseParams);

  // Yakuniy payload
  const payload = { ...baseParams, sign };

  const url = `${BASE_URL}${path}`;

  // Form-data formatiga o'giramiz
  const body = qs.stringify(payload);

  // API ga so'rov yuboramiz
  const res = await axios.post(url, body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return res.data;
}

/* ------------------------------------------------------
 * 1) Product list — Mobile Legends paketlari ro’yxatini olish
 * ------------------------------------------------------ */
async function getProductList() {
  const data = await smilePost("/smilecoin/api/productlist", {
    product: PRODUCT_NAME,
  });
  return data;
}

/* ------------------------------------------------------
 * 2) Role check — foydalanuvchi ID tekshiruv
 * Bu yerda ML profil mavjudligini tekshiradi
 * ------------------------------------------------------ */
async function checkRole({ userid, zoneid, productid }) {
  const data = await smilePost("/smilecoin/api/getrole", {
    product: PRODUCT_NAME,
    userid,
    zoneid,
    productid,
  });
  return data;
}

/* ------------------------------------------------------
 * 3) Create order — diamond sotib olish
 * Bu bosqich Smile One balansidan pulni yechadi
 * ------------------------------------------------------ */
async function createOrder({ userid, zoneid, productid }) {
  const data = await smilePost("/smilecoin/api/createorder", {
    product: PRODUCT_NAME,
    userid,
    zoneid,
    productid,
  });
  return data;
}

/* ------------------------------------------------------
 * 4) High-level: Mobile Legends to‘ldirish (topup)
 * ------------------------------------------------------ */
async function topupMobileLegends({ userid, zoneid, productid }) {
  // 1) Avval role check qilamiz
  const role = await checkRole({ userid, zoneid, productid });

  if (role.status !== 200) {
    return {
      success: false,
      step: "role_check",
      raw: role,
    };
  }

  // 2) Role OK bo‘lsa — create order
  const order = await createOrder({ userid, zoneid, productid });

  if (order.status !== 200) {
    return {
      success: false,
      step: "create_order",
      raw: order,
    };
  }

  return {
    success: true,
    order_id: order.order_id,
    role,
    order,
  };
}

export { getProductList, checkRole, createOrder, topupMobileLegends };
