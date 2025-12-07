// smileClient.js
const crypto = require("crypto");
const axios = require("axios");
require("dotenv").config();

const BASE_URL = process.env.SMILE_BASE_URL;
const EMAIL = process.env.SMILE_EMAIL;
const UID = process.env.SMILE_UID;
const KEY = process.env.SMILE_KEY;

/**
 * Smile One sign generatsiyasi:
 * 1) paramlar key bo'yicha sort
 * 2) "k1=v1&k2=v2&...&" + KEY
 * 3) md5(md5(string))
 * Dokumentdan olingan formulaga mos: sign = md5(md5("key1=value1&key2=value2&" . $key)) :contentReference[oaicite:1]{index=1}
 */
function createSign(params) {
  const keys = Object.keys(params)
    .filter(
      (k) => params[k] !== undefined && params[k] !== null && k !== "sign"
    )
    .sort();

  const baseString = keys.map((k) => `${k}=${params[k]}`).join("&") + "&" + KEY;

  const first = crypto.createHash("md5").update(baseString).digest("hex");
  const second = crypto.createHash("md5").update(first).digest("hex");
  return second;
}

/**
 * Har bir request uchun umumiy body:
 * - uid, email, time qo'shamiz
 * - sign hisoblaymiz
 */
function buildBody(extraParams = {}) {
  const time = Math.floor(Date.now() / 1000); // unix time (sec)
  const base = {
    uid: UID,
    email: EMAIL,
    time,
    ...extraParams,
  };

  const sign = createSign(base);
  return { ...base, sign };
}

/**
 * Form-encoded POST helper
 */
async function postForm(path, extraParams = {}) {
  const body = buildBody(extraParams);

  const response = await axios.post(
    `${BASE_URL}${path}`,
    new URLSearchParams(body).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      //   timeout: 15000,
    }
  );

  return response.data;
}

/**
 * 1) Product ro'yxatini olish
 * API: /smilecoin/api/productlist :contentReference[oaicite:2]{index=2}
 */
async function getProductList(productName) {
  return postForm("/smilecoin/api/productlist", {
    product: productName, // masalan: "mobilelegends"
  });
}

/**
 * 2) Role tekshirish
 * API: /smilecoin/api/getrole :contentReference[oaicite:3]{index=3}
 */
async function getRole({ userid, zoneid, product, productid }) {
  return postForm("/smilecoin/api/getrole", {
    userid,
    zoneid,
    product,
    productid,
  });
}

/**
 * 3) Buyurtma yaratish
 * API: /smilecoin/api/createorder :contentReference[oaicite:4]{index=4}
 */
async function createOrder({ userid, zoneid, product, productid }) {
  return postForm("/smilecoin/api/createorder", {
    userid,
    zoneid,
    product,
    productid,
  });
}

module.exports = {
  getProductList,
  getRole,
  createOrder,
};
