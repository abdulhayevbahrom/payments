// import TonWeb from "tonweb";
// import { mnemonicToPrivateKey } from "@ton/crypto";
// import axios from "axios";

// /**
//  * TON provider
//  */
// const tonweb = new TonWeb(
//   new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
//     apiKey: process.env.TONCENTER_API_KEY || undefined,
//   })
// );

// /**
//  * KONSTANTALAR
//  */
// const FRAGMENT_API_URL =
//   process.env.FRAGMENT_API_URL || "https://v1.fragmentapi.com/api/v1/partner";

// const FRAGMENT_ADDRESS =
//   process.env.FRAGMENT_ADDRESS ||
//   "UQAqdtZBZ4hCk93V3J6V3Il9llOTeoAE5HRY8Lq6ndRyTLCh"; // TODO: real Fragment addressni envda saqlang

// // Narxlar mappingi
// const PRICE_TABLE = {
//   star: {
//     50: 0.1,
//     100: 0.2,
//     500: 0.9,
//     1000: 1.7,
//   },
//   premium: {
//     1: 0.5,
//     3: 1.4,
//     6: 2.7,
//     12: 5.0,
//   },
// };

// // Fragment endpointlari (kerak bo‘lsa o‘zgartirish oson bo‘lishi uchun)
// const FRAGMENT_ENDPOINTS = {
//   star: "/orders/star",
//   premium: "/orders/premium",
// };

// /**
//  * Yordamchi funksiyalar
//  */

// // Mnemoniкdan wallet yaratish
// async function getWalletFromMnemonic() {
//   const WALLET_MNEMONIC = process.env.WALLET_MNEMONIC;

//   if (!WALLET_MNEMONIC) {
//     throw new Error("WALLET_MNEMONIC topilmadi (env da yo'q)");
//   }

//   const mnemonicArray = WALLET_MNEMONIC.trim().split(/\s+/);

//   if (mnemonicArray.length !== 24) {
//     throw new Error("Mnemonic 24 ta so'zdan iborat bo'lishi kerak");
//   }

//   const keyPairData = await mnemonicToPrivateKey(mnemonicArray);

//   const WalletClass = tonweb.wallet.all.v4R2;
//   const wallet = new WalletClass(tonweb.provider, {
//     publicKey: keyPairData.publicKey,
//     wc: 0,
//   });

//   const walletAddress = await wallet.getAddress();

//   return {
//     wallet,
//     walletAddress,
//     keyPair: {
//       publicKey: keyPairData.publicKey,
//       secretKey: keyPairData.secretKey,
//     },
//   };
// }

// // Oddiy text comment uchun Cell yaratish (TON standart comment payload)
// function buildCommentCell(text) {
//   const cell = new TonWeb.boc.Cell();
//   // 32 bit nol – "text comment" op code
//   cell.bits.writeUint(0, 32);
//   cell.bits.writeString(text || "");
//   return cell;
// }

// // Narxni hisoblash
// function calculatePrice(productType, amount) {
//   const type = String(productType || "").toLowerCase();
//   const amt = Number(amount);

//   if (!["star", "premium"].includes(type)) {
//     throw new Error('productType faqat "star" yoki "premium" bo\'lishi mumkin');
//   }

//   if (!Number.isFinite(amt) || amt <= 0) {
//     throw new Error("amount noto'g'ri");
//   }

//   const table = PRICE_TABLE[type];
//   const priceInTON = table ? table[amt] : undefined;

//   if (!priceInTON) {
//     throw new Error(`${type} uchun ${amt} miqdori mavjud emas`);
//   }

//   return {
//     type,
//     amount: amt,
//     priceInTON,
//   };
// }

// // Fragment API request helper
// async function callFragmentApi({ endpoint, body }) {
//   const FRAGMENT_API_KEY =
//     process.env.FRAGMENT_API_KEY ||
//     "sLUUx5MkzylOfJ3MzCTnk-k2Z1-0Opmnxnyd0bJ3li0=";

//   if (!FRAGMENT_API_KEY) {
//     throw new Error("FRAGMENT_API_KEY topilmadi (env da yo'q)");
//   }

//   const url = `${FRAGMENT_API_URL}${endpoint}`;

//   const response = await axios.post(url, body, {
//     headers: {
//       Authorization: `Bearer ${FRAGMENT_API_KEY}`,
//       "Content-Type": "application/json",
//       "API-Key": FRAGMENT_API_KEY,
//     },
//     timeout: 30000,
//   });

//   return response.data;
// }

// /**
//  * Controller
//  */
// class PaymentController {
//   /**
//    * POST /purchase
//    * Body: { username, productType: "star"|"premium", amount }
//    */
//   async purchaseProduct(req, res) {
//     try {
//       const { username, productType, amount } = req.body || {};

//       // 1. Validatsiya (basic)
//       if (!username || !productType || amount === undefined) {
//         return res.status(400).json({
//           success: false,
//           message: "username, productType va amount majburiy",
//         });
//       }

//       // 2. Narxni hisoblash
//       let normalized;
//       try {
//         normalized = calculatePrice(productType, amount);
//       } catch (err) {
//         return res.status(400).json({
//           success: false,
//           message: err.message,
//         });
//       }

//       const { type, amount: normalizedAmount, priceInTON } = normalized;

//       // 3. Walletdan Fragment addressiga to'lov yuborish
//       const paymentResult = await this.withdrawFromWallet(priceInTON);

//       if (!paymentResult.success) {
//         return res.status(502).json({
//           success: false,
//           message: "TON to'lovi amalga oshmadi",
//           error: paymentResult.error,
//         });
//       }

//       // 4. Fragment dan mahsulot sotib olish
//       const purchaseResult = await this.buyFromFragment({
//         username,
//         productType: type,
//         amount: normalizedAmount,
//         paymentProof: paymentResult.paymentProof,
//       });

//       if (!purchaseResult.success) {
//         // Eslatma: bu yerda real refund mexanizmi yo'q, faqat xato haqida signal
//         return res.status(502).json({
//           success: false,
//           message: "Fragment dan sotib olishda xatolik",
//           error: purchaseResult.error,
//           paymentProof: paymentResult.paymentProof,
//         });
//       }

//       // 5. OK
//       return res.status(200).json({
//         success: true,
//         message: `${type} muvaffaqiyatli sotib olindi`,
//         data: {
//           username,
//           productType: type,
//           amount: normalizedAmount,
//           priceInTON,
//           paymentProof: paymentResult.paymentProof,
//           fragmentOrderId: purchaseResult.orderId,
//           fragmentRawResponse: purchaseResult.raw,
//         },
//       });
//     } catch (error) {
//       console.error("purchaseProduct error:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Serverda xatolik yuz berdi",
//         error: error.message,
//       });
//     }
//   }

//   /**
//    * TON walletdan Fragment addressiga pul yuborish
//    * amountInTON: number
//    */
//   async withdrawFromWallet(amountInTON) {
//     try {
//       if (!Number.isFinite(amountInTON) || amountInTON <= 0) {
//         throw new Error("amountInTON noto'g'ri");
//       }

//       const { wallet, walletAddress, keyPair } = await getWalletFromMnemonic();

//       // Balansni tekshirish
//       const balanceNano = await tonweb.getBalance(walletAddress);
//       const balanceInTON = parseFloat(TonWeb.utils.fromNano(balanceNano));

//       console.log("Wallet:", walletAddress.toString(true, true, true));
//       console.log("Balance:", balanceInTON, "TON");

//       if (balanceInTON < amountInTON) {
//         return {
//           success: false,
//           error: `Balansda yetarli mablag' yo'q. Kerak: ${amountInTON} TON, mavjud: ${balanceInTON} TON`,
//         };
//       }

//       // Seqno
//       const seqno = (await wallet.methods.seqno().call()) || 0;

//       // Comment payload
//       const commentCell = buildCommentCell(
//         "Payment for Telegram Stars/Premium"
//       );

//       // Transfer
//       const transfer = wallet.methods.transfer({
//         secretKey: keyPair.secretKey,
//         toAddress: FRAGMENT_ADDRESS,
//         amount: TonWeb.utils.toNano(amountInTON.toString()),
//         seqno,
//         payload: commentCell,
//         sendMode: 3,
//       });

//       // Xabarni yuborish
//       await transfer.send();
//       console.log("Transfer sent to Fragment address");

//       // BOC (payment proof sifatida ishlatish mumkin)
//       const msgCell = await transfer.getQuery();
//       const msgBoc = await msgCell.toBoc(false);
//       const paymentProof = TonWeb.utils.bytesToBase64(msgBoc);

//       // Minimal kutish (agar kerak bo'lsa keyin real tx status check qo‘shasiz)
//       await new Promise((resolve) => setTimeout(resolve, 5000));

//       return {
//         success: true,
//         paymentProof, // Fragment API uchun payment_proof sifatida ishlatyapmiz
//         amountInTON,
//         fromAddress: walletAddress.toString(true, true, true),
//         toAddress: FRAGMENT_ADDRESS,
//       };
//     } catch (error) {
//       console.error("withdrawFromWallet error:", error);
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   }

//   /**
//    * Fragment API orqali Star/Premium sotib olish
//    * params: { username, productType, amount, paymentProof }
//    */
//   async buyFromFragment({ username, productType, amount, paymentProof }) {
//     try {
//       const type = String(productType || "").toLowerCase();

//       if (!["star", "premium"].includes(type)) {
//         throw new Error(
//           'productType faqat "star" yoki "premium" bo\'lishi mumkin'
//         );
//       }

//       const endpoint = FRAGMENT_ENDPOINTS[type];
//       if (!endpoint) {
//         throw new Error(`Fragment endpoint topilmadi (${type})`);
//       }

//       const body = {
//         username,
//         amount,
//         payment_proof: paymentProof,
//       };

//       const data = await callFragmentApi({ endpoint, body });

//       // Fragment response formatiga qarab moslashtirish kerak
//       if (data && (data.success === true || data.status === "ok")) {
//         return {
//           success: true,
//           orderId: data.order_id || data.id || null,
//           raw: data,
//         };
//       }

//       return {
//         success: false,
//         error:
//           data?.message ||
//           data?.error ||
//           "Fragment API xatolik qaytardi (success=false)",
//         raw: data,
//       };
//     } catch (error) {
//       console.error("buyFromFragment error:", error?.response?.data || error);
//       return {
//         success: false,
//         error:
//           error?.response?.data?.message ||
//           error?.response?.data?.error ||
//           error.message,
//       };
//     }
//   }

//   /**
//    * GET /balance
//    * TON wallet balansini tekshirish
//    */
//   async checkBalance(req, res) {
//     try {
//       const { wallet, walletAddress } = await getWalletFromMnemonic();

//       const balanceNano = await tonweb.getBalance(walletAddress);
//       const balanceInTON = parseFloat(TonWeb.utils.fromNano(balanceNano));

//       return res.status(200).json({
//         success: true,
//         data: {
//           address: walletAddress.toString(true, true, true),
//           balance: balanceInTON,
//           balanceNano: balanceNano.toString(),
//         },
//       });
//     } catch (error) {
//       console.error("checkBalance error:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Balansni tekshirishda xatolik",
//         error: error.message,
//       });
//     }
//   }
// }

// export default new PaymentController();
// -----------------------------------------------------------------------
// import TonWeb from "tonweb";
// import { mnemonicToPrivateKey } from "@ton/crypto";
// import axios from "axios";

// /**
//  * TON provider
//  */
// const tonweb = new TonWeb(
//   new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
//     apiKey: process.env.TONCENTER_API_KEY || undefined,
//   })
// );

// /**
//  * KONSTANTALAR
//  */
// const FRAGMENT_API_URL =
//   process.env.FRAGMENT_API_URL || "https://v1.fragmentapi.com/api/v1/partner";

// const FRAGMENT_ADDRESS =
//   process.env.FRAGMENT_ADDRESS ||
//   "UQAqdtZBZ4hCk93V3J6V3Il9llOTeoAE5HRY8Lq6ndRyTLCh"; // TODO: env orqali real address

// // Narxlar mappingi (TON bo'yicha)
// const PRICE_TABLE = {
//   star: {
//     50: 0.1,
//     100: 0.2,
//     500: 0.9,
//     1000: 1.7,
//   },
//   premium: {
//     1: 0.5,
//     3: 1.4,
//     6: 2.7,
//     12: 5.0,
//   },
// };

// // Fragment endpointlari (docs bo'yicha)
// const FRAGMENT_ENDPOINTS = {
//   star: "/orders/star",
//   premium: "/orders/premium", // Premium uchun keyin docsga qarab moslashtirasiz
// };

// /**
//  * Yordamchi funksiyalar
//  */

// // Mnemonikdan wallet yaratish
// async function getWalletFromMnemonic() {
//   const WALLET_MNEMONIC = process.env.WALLET_MNEMONIC;

//   if (!WALLET_MNEMONIC) {
//     throw new Error("WALLET_MNEMONIC topilmadi (env da yo'q)");
//   }

//   const mnemonicArray = WALLET_MNEMONIC.trim().split(/\s+/);

//   if (mnemonicArray.length !== 24) {
//     throw new Error("Mnemonic 24 ta so'zdan iborat bo'lishi kerak");
//   }

//   const keyPairData = await mnemonicToPrivateKey(mnemonicArray);

//   const WalletClass = tonweb.wallet.all.v4R2;
//   const wallet = new WalletClass(tonweb.provider, {
//     publicKey: keyPairData.publicKey,
//     wc: 0,
//   });

//   const walletAddress = await wallet.getAddress();

//   return {
//     wallet,
//     walletAddress,
//     keyPair: {
//       publicKey: keyPairData.publicKey,
//       secretKey: keyPairData.secretKey,
//     },
//   };
// }

// // Oddiy text comment uchun Cell (TON standart comment payload)
// function buildCommentCell(text) {
//   const cell = new TonWeb.boc.Cell();
//   // 32 bit nol – "text comment" op code
//   cell.bits.writeUint(0, 32);
//   cell.bits.writeString(text || "");
//   return cell;
// }

// // Narxni hisoblash
// function calculatePrice(productType, amount) {
//   const type = String(productType || "").toLowerCase();
//   const amt = Number(amount);

//   if (!["star", "premium"].includes(type)) {
//     throw new Error('productType faqat "star" yoki "premium" bo\'lishi mumkin');
//   }

//   if (!Number.isFinite(amt) || amt <= 0) {
//     throw new Error("amount noto'g'ri");
//   }

//   const table = PRICE_TABLE[type];
//   const priceInTON = table ? table[amt] : undefined;

//   if (!priceInTON) {
//     throw new Error(`${type} uchun ${amt} miqdori mavjud emas`);
//   }

//   return {
//     type,
//     amount: amt,
//     priceInTON,
//   };
// }

// // Fragment API request helper
// async function callFragmentApi({ endpoint, body }) {
//   const FRAGMENT_API_KEY = process.env.FRAGMENT_API_KEY;

//   if (!FRAGMENT_API_KEY) {
//     throw new Error("FRAGMENT_API_KEY topilmadi (env da yo'q)");
//   }

//   const url = `${FRAGMENT_API_URL}${endpoint}`;

//   console.log("Fragment request:", { url, body });

//   const response = await axios.post(url, body, {
//     headers: {
//       // Docs bo'yicha:
//       // -H "API-Key: your_api_key_here"
//       "API-Key": FRAGMENT_API_KEY,
//       "Content-Type": "application/json",
//     },
//     timeout: 30000,
//   });

//   return response.data;
// }

// /**
//  * Controller
//  */
// class PaymentController {
//   /**
//    * POST /purchase
//    * Body: {
//    *   username,
//    *   productType: "star"|"premium",
//    *   amount,
//    *   recipientHash,   // star uchun kerak
//    *   walletType       // default: "TON"
//    * }
//    */
//   async purchaseProduct(req, res) {
//     try {
//       const {
//         username,
//         productType,
//         amount,
//         recipientHash,
//         walletType = "TON",
//       } = req.body || {};

//       // 1. Validatsiya (basic)
//       if (!username || !productType || amount === undefined) {
//         return res.status(400).json({
//           success: false,
//           message: "username, productType va amount majburiy",
//         });
//       }

//       if (String(productType).toLowerCase() === "star" && !recipientHash) {
//         return res.status(400).json({
//           success: false,
//           message: "Star uchun recipientHash majburiy",
//         });
//       }

//       // 2. Narxni hisoblash
//       let normalized;
//       try {
//         normalized = calculatePrice(productType, amount);
//       } catch (err) {
//         return res.status(400).json({
//           success: false,
//           message: err.message,
//         });
//       }

//       const { type, amount: normalizedAmount, priceInTON } = normalized;

//       // 3. Walletdan Fragment addressiga to'lov yuborish (agar bu sizning biznes-logikangiz bo'lsa)
//       const paymentResult = await this.withdrawFromWallet(priceInTON);

//       if (!paymentResult.success) {
//         return res.status(502).json({
//           success: false,
//           message: "TON to'lovi amalga oshmadi",
//           error: paymentResult.error,
//         });
//       }

//       // 4. Fragment dan mahsulot sotib olish (docs bo'yicha)
//       const purchaseResult = await this.buyFromFragment({
//         username,
//         productType: type,
//         amount: normalizedAmount,
//         paymentProof: paymentResult.paymentProof, // hozircha star body’da ishlatilmaydi
//         recipientHash,
//         walletType,
//       });

//       if (!purchaseResult.success) {
//         return res.status(502).json({
//           success: false,
//           message: "Fragment dan sotib olishda xatolik",
//           error: purchaseResult.error,
//           paymentProof: paymentResult.paymentProof,
//           fragmentRawResponse: purchaseResult.raw,
//         });
//       }

//       // 5. OK
//       return res.status(200).json({
//         success: true,
//         message: `${type} muvaffaqiyatli sotib olindi`,
//         data: {
//           username,
//           productType: type,
//           amount: normalizedAmount,
//           priceInTON,
//           paymentProof: paymentResult.paymentProof,
//           fragmentOrderId: purchaseResult.orderId,
//           fragmentRawResponse: purchaseResult.raw,
//         },
//       });
//     } catch (error) {
//       console.error("purchaseProduct error:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Serverda xatolik yuz berdi",
//         error: error.message,
//       });
//     }
//   }

//   /**
//    * TON walletdan Fragment addressiga pul yuborish
//    * amountInTON: number
//    */
//   async withdrawFromWallet(amountInTON) {
//     try {
//       if (!Number.isFinite(amountInTON) || amountInTON <= 0) {
//         throw new Error("amountInTON noto'g'ri");
//       }

//       const { wallet, walletAddress, keyPair } = await getWalletFromMnemonic();

//       // Balansni tekshirish
//       const balanceNano = await tonweb.getBalance(walletAddress);
//       const balanceInTON = parseFloat(TonWeb.utils.fromNano(balanceNano));

//       console.log("Wallet:", walletAddress.toString(true, true, true));
//       console.log("Balance:", balanceInTON, "TON");

//       if (balanceInTON < amountInTON) {
//         return {
//           success: false,
//           error: `Balansda yetarli mablag' yo'q. Kerak: ${amountInTON} TON, mavjud: ${balanceInTON} TON`,
//         };
//       }

//       // Seqno
//       const seqno = (await wallet.methods.seqno().call()) || 0;

//       // Comment payload
//       const commentCell = buildCommentCell(
//         "Payment for Telegram Stars/Premium"
//       );

//       // Transfer
//       const transfer = wallet.methods.transfer({
//         secretKey: keyPair.secretKey,
//         toAddress: FRAGMENT_ADDRESS,
//         amount: TonWeb.utils.toNano(amountInTON.toString()),
//         seqno,
//         payload: commentCell,
//         sendMode: 3,
//       });

//       // Xabarni yuborish
//       await transfer.send();
//       console.log("Transfer sent to Fragment address");

//       // BOC (payment proof sifatida ishlatish mumkin)
//       const msgCell = await transfer.getQuery();
//       const msgBoc = await msgCell.toBoc(false);
//       const paymentProof = TonWeb.utils.bytesToBase64(msgBoc);

//       // Minimal kutish (agar kerak bo'lsa keyin real tx status check qo‘shasiz)
//       await new Promise((resolve) => setTimeout(resolve, 5000));

//       return {
//         success: true,
//         paymentProof, // hozircha Fragment body’da ishlatilmayapti
//         amountInTON,
//         fromAddress: walletAddress.toString(true, true, true),
//         toAddress: FRAGMENT_ADDRESS,
//       };
//     } catch (error) {
//       console.error("withdrawFromWallet error:", error);
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   }

//   /**
//    * Fragment API orqali Star/Premium sotib olish
//    * params: { username, productType, amount, paymentProof, recipientHash, walletType }
//    */
//   async buyFromFragment({
//     username,
//     productType,
//     amount,
//     paymentProof, // hozircha ishlatilmayapti (docs-da yo'q)
//     recipientHash,
//     walletType = "TON",
//   }) {
//     try {
//       const type = String(productType || "").toLowerCase();

//       if (!["star", "premium"].includes(type)) {
//         throw new Error(
//           'productType faqat "star" yoki "premium" bo\'lishi mumkin'
//         );
//       }

//       const endpoint = FRAGMENT_ENDPOINTS[type];
//       if (!endpoint) {
//         throw new Error(`Fragment endpoint topilmadi (${type})`);
//       }

//       let body;

//       if (type === "star") {
//         // DOCS format:
//         // {
//         //   "username": "johndoe",
//         //   "recipient_hash": "ABCDEF123456",
//         //   "quantity": 100,
//         //   "wallet_type": "TON"
//         // }
//         body = {
//           username,
//           recipient_hash: recipientHash,
//           quantity: amount,
//           wallet_type: walletType,
//         };
//       } else {
//         // PREMIUM uchun Fragment docsini ko'rib aniq formatni qo'yish kerak.
//         // Hozircha fallback variant (xatolik qaytarishi mumkin).
//         body = {
//           username,
//           quantity: amount,
//           wallet_type: walletType,
//         };
//       }

//       const data = await callFragmentApi({ endpoint, body });

//       // Docs'dagi misolda:
//       // {
//       //   "order_id": "...",
//       //   "status": "pending",
//       //   "username": "johndoe",
//       //   "quantity": 100,
//       //   "amount": 55.5,
//       //   "created_at": "..."
//       // }
//       if (data && (data.status === "pending" || data.status === "ok")) {
//         return {
//           success: true,
//           orderId: data.order_id || data.id || null,
//           raw: data,
//         };
//       }

//       return {
//         success: false,
//         error:
//           data?.message ||
//           data?.error ||
//           "Fragment API xatolik qaytardi (status != pending/ok)",
//         raw: data,
//       };
//     } catch (error) {
//       console.error("buyFromFragment error:", error?.response?.data || error);
//       return {
//         success: false,
//         error:
//           error?.response?.data?.message ||
//           error?.response?.data?.error ||
//           error.message,
//       };
//     }
//   }

//   /**
//    * GET /balance
//    * TON wallet balansini tekshirish
//    */
//   async checkBalance(req, res) {
//     try {
//       const { walletAddress } = await getWalletFromMnemonic();

//       const balanceNano = await tonweb.getBalance(walletAddress);
//       const balanceInTON = parseFloat(TonWeb.utils.fromNano(balanceNano));

//       return res.status(200).json({
//         success: true,
//         data: {
//           address: walletAddress.toString(true, true, true),
//           balance: balanceInTON,
//           balanceNano: balanceNano.toString(),
//         },
//       });
//     } catch (error) {
//       console.error("checkBalance error:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Balansni tekshirishda xatolik",
//         error: error.message,
//       });
//     }
//   }
// }

// export default new PaymentController();

// payment.controller.js (yoki o'zing ishlatayotgan nom)

// Importlar
// payment.controller.js
import TonWeb from "tonweb";
import { mnemonicToPrivateKey } from "@ton/crypto";
import axios from "axios";

/**
 * TON provider
 */
const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
    apiKey: process.env.TONCENTER_API_KEY || undefined,
  })
);

/**
 * KONSTANTALAR
 */
const FRAGMENT_API_URL =
  process.env.FRAGMENT_API_URL || "https://v1.fragmentapi.com/api/v1/partner";

const FRAGMENT_ADDRESS =
  process.env.FRAGMENT_ADDRESS ||
  "UQAqdtZBZ4hCk93V3J6V3Il9llOTeoAE5HRY8Lq6ndRyTLCh";

// Test rejimi (agar FRAGMENT_TEST_MODE=true bo'lsa)
// DIQQAT: Development uchun true, production uchun false qiling!
const TEST_MODE = process.env.FRAGMENT_TEST_MODE === "true" || true; // ✅ Hozir doim true

// Test uchun fake user ID (faqat development da)
const TEST_USER_ID = process.env.TEST_USER_ID || "123456789";

console.log("🔧 Fragment API konfiguratsiya:");
console.log("- URL:", FRAGMENT_API_URL);
console.log("- Test rejimi:", TEST_MODE ? "✅ Yoqilgan" : "❌ O'chirilgan");
if (TEST_MODE) {
  console.log("- Test User ID:", TEST_USER_ID);
  console.log(
    "⚠️  DIQQAT: Test rejimida Fragment API ga real to'lov yuborilmaydi!"
  );
}

// Narxlar mappingi (TON bo'yicha)
const PRICE_TABLE = {
  star: {
    50: 0.1,
    100: 0.2,
    500: 0.9,
    1000: 1.7,
  },
  premium: {
    1: 0.5,
    3: 1.4,
    6: 2.7,
    12: 5.0,
  },
};

// Fragment endpointlari
const FRAGMENT_ENDPOINTS = {
  star: "/orders/star",
  premium: "/orders/premium",
};

/**
 * YORDAMCHI FUNKSIYALAR
 */

// Mnemonikdan wallet yaratish
async function getWalletFromMnemonic() {
  const WALLET_MNEMONIC = process.env.WALLET_MNEMONIC;

  if (!WALLET_MNEMONIC) {
    throw new Error("WALLET_MNEMONIC topilmadi (env da yo'q)");
  }

  const mnemonicArray = WALLET_MNEMONIC.trim().split(/\s+/);

  if (mnemonicArray.length !== 24) {
    throw new Error("Mnemonic 24 ta so'zdan iborat bo'lishi kerak");
  }

  const keyPairData = await mnemonicToPrivateKey(mnemonicArray);

  const WalletClass = tonweb.wallet.all.v4R2;
  const wallet = new WalletClass(tonweb.provider, {
    publicKey: keyPairData.publicKey,
    wc: 0,
  });

  const walletAddress = await wallet.getAddress();

  return {
    wallet,
    walletAddress,
    keyPair: {
      publicKey: keyPairData.publicKey,
      secretKey: keyPairData.secretKey,
    },
  };
}

// Oddiy text comment uchun Cell
function buildCommentCell(text) {
  const cell = new TonWeb.boc.Cell();
  cell.bits.writeUint(0, 32); // "text comment" op code
  cell.bits.writeString(text || "");
  return cell;
}

// Narxni hisoblash
function calculatePrice(productType, amount) {
  const type = String(productType || "").toLowerCase();
  const amt = Number(amount);

  if (!["star", "premium"].includes(type)) {
    throw new Error('productType faqat "star" yoki "premium" bo\'lishi mumkin');
  }

  if (!Number.isFinite(amt) || amt <= 0) {
    throw new Error("amount noto'g'ri");
  }

  const table = PRICE_TABLE[type];
  const priceInTON = table ? table[amt] : undefined;

  if (!priceInTON) {
    throw new Error(`${type} uchun ${amt} miqdori mavjud emas`);
  }

  return {
    type,
    amount: amt,
    priceInTON,
  };
}

// Fragment API helper
async function callFragmentApi({ endpoint, body }) {
  const FRAGMENT_API_KEY = process.env.FRAGMENT_API_KEY;

  if (!FRAGMENT_API_KEY) {
    throw new Error("FRAGMENT_API_KEY topilmadi (env da yo'q)");
  }

  const url = `${FRAGMENT_API_URL}${endpoint}`;

  console.log("=".repeat(60));
  console.log("Fragment API Request:");
  console.log("URL:", url);
  console.log("Body:", JSON.stringify(body, null, 2));
  console.log("=".repeat(60));

  const response = await axios.post(url, body, {
    headers: {
      "API-Key": FRAGMENT_API_KEY,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });

  console.log("Fragment API Response:");
  console.log("Status:", response.status);
  console.log("Data:", JSON.stringify(response.data, null, 2));
  console.log("=".repeat(60));

  return response.data;
}

/**
 * CONTROLLER
 */
class PaymentController {
  /**
   * POST /api/purchase
   * Body: {
   *   username: string,
   *   productType: "star" | "premium",
   *   amount: number,
   *   recipientHash?: string (star uchun majburiy),
   *   walletType?: "TON"
   * }
   */
  async purchaseProduct(req, res) {
    try {
      const {
        username,
        productType,
        amount,
        recipientHash,
        walletType = "TON",
      } = req.body || {};

      console.log("\n" + "=".repeat(60));
      console.log("PURCHASE REQUEST STARTED");
      console.log("=".repeat(60));
      console.log("Request body:", JSON.stringify(req.body, null, 2));

      // 1. Validatsiya
      if (!username || !productType || amount === undefined) {
        console.log("❌ Validatsiya xatosi: majburiy maydonlar yo'q");
        return res.status(400).json({
          success: false,
          message: "username, productType va amount majburiy",
        });
      }

      // Star uchun recipientHash tekshirish
      let finalRecipientHash = recipientHash;
      if (productType.toLowerCase() === "star") {
        if (!recipientHash) {
          // Test rejimida fake ID ishlatish
          if (TEST_MODE) {
            console.log(
              "⚠️  TEST REJIMI: recipientHash berilmagan, test ID ishlatilmoqda"
            );
            finalRecipientHash = TEST_USER_ID;
          } else {
            console.log("❌ recipientHash berilmagan");
            return res.status(400).json({
              success: false,
              message:
                "Star sotib olish uchun recipientHash (Telegram User ID) majburiy.",
              example: {
                correct: "recipientHash: '987654321'",
                incorrect: "recipientHash: 'bahromjon_abdulhayev'",
              },
              howToGetYourId: [
                "1. Telegram da @userinfobot ni qidiring",
                "2. 'Start' tugmasini bosing",
                "3. Bot sizga User ID ni yuboradi",
              ],
              orUseOnlineTool: "https://tg-user.id/ - username kiriting",
            });
          }
        } else {
          // User ID raqam ekanligini tekshirish
          if (!/^\d+$/.test(recipientHash)) {
            console.log("❌ recipientHash raqam emas:", recipientHash);
            return res.status(400).json({
              success: false,
              message:
                "recipientHash Telegram User ID (faqat raqamlar) bo'lishi kerak",
              received: recipientHash,
              expectedFormat: "Raqamli ID, masalan: 987654321",
              howToGetYourId: "Telegram da @userinfobot ni ishlating",
            });
          }

          finalRecipientHash = recipientHash;
        }

        console.log("✅ Telegram User ID:", finalRecipientHash);
      }

      // 2. Narxni hisoblash
      let normalized;
      try {
        normalized = calculatePrice(productType, amount);
        console.log("✅ Narx hisoblandi:", normalized);
      } catch (err) {
        console.log("❌ Narx hisoblashda xato:", err.message);
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      const { type, amount: normalizedAmount, priceInTON } = normalized;

      // 3. Walletdan Fragment addressiga TON yuborish
      console.log("\n🔄 TON to'lovini boshlash...");

      // Test rejimida to'lovni o'tkazib yuborish
      let paymentResult;
      if (TEST_MODE) {
        console.log(
          "⚠️  TEST REJIMI: Real to'lov qilinmaydi, fake payment proof yaratilmoqda"
        );
        paymentResult = {
          success: true,
          paymentProof: "TEST_PAYMENT_PROOF_" + Date.now(),
          amountInTON: priceInTON,
          fromAddress: "TEST_WALLET_ADDRESS",
          toAddress: FRAGMENT_ADDRESS,
        };
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s kutish
      } else {
        paymentResult = await this.withdrawFromWallet(priceInTON);
      }

      if (!paymentResult.success) {
        console.log("❌ TON to'lovi muvaffaqiyatsiz:", paymentResult.error);
        return res.status(502).json({
          success: false,
          message: "TON to'lovi amalga oshmadi",
          error: paymentResult.error,
        });
      }

      console.log("✅ TON to'lovi muvaffaqiyatli:", {
        amount: paymentResult.amountInTON,
        from: paymentResult.fromAddress,
        to: paymentResult.toAddress,
      });

      // 4. Fragment dan mahsulot sotib olish
      console.log("\n🔄 Fragment dan sotib olishni boshlash...");
      const purchaseResult = await this.buyFromFragment({
        username,
        productType: type,
        amount: normalizedAmount,
        paymentProof: paymentResult.paymentProof,
        recipientHash: finalRecipientHash,
        walletType,
      });

      if (!purchaseResult.success) {
        console.log(
          "❌ Fragment dan sotib olish muvaffaqiyatsiz:",
          purchaseResult.error
        );
        return res.status(502).json({
          success: false,
          message: "Fragment dan sotib olishda xatolik",
          error: purchaseResult.error,
          paymentProof: paymentResult.paymentProof,
          fragmentRawResponse: purchaseResult.raw,
        });
      }

      console.log("✅ Fragment dan sotib olish muvaffaqiyatli!");

      // 5. OK
      console.log("\n" + "=".repeat(60));
      console.log("✅ PURCHASE COMPLETED SUCCESSFULLY");
      console.log("=".repeat(60) + "\n");

      return res.status(200).json({
        success: true,
        message: `${type} muvaffaqiyatli sotib olindi`,
        data: {
          username,
          productType: type,
          amount: normalizedAmount,
          priceInTON,
          paymentProof: paymentResult.paymentProof,
          fragmentOrderId: purchaseResult.orderId,
          fragmentRawResponse: purchaseResult.raw,
        },
      });
    } catch (error) {
      console.error("\n❌ CRITICAL ERROR in purchaseProduct:");
      console.error(error);
      console.log("=".repeat(60) + "\n");

      return res.status(500).json({
        success: false,
        message: "Serverda xatolik yuz berdi",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }

  /**
   * TON walletdan Fragment addressiga pul yuborish
   */
  async withdrawFromWallet(amountInTON) {
    try {
      console.log("\n📤 Withdraw operatsiyasi boshlandi");
      console.log("Yuborilishi kerak:", amountInTON, "TON");

      if (!Number.isFinite(amountInTON) || amountInTON <= 0) {
        throw new Error("amountInTON noto'g'ri");
      }

      const { wallet, walletAddress, keyPair } = await getWalletFromMnemonic();

      const balanceNano = await tonweb.getBalance(walletAddress);
      const balanceInTON = parseFloat(TonWeb.utils.fromNano(balanceNano));

      const walletAddressString = walletAddress.toString(true, true, true);

      console.log("Wallet address:", walletAddressString);
      console.log("Joriy balans:", balanceInTON, "TON");
      console.log("Kerakli miqdor:", amountInTON, "TON");

      if (balanceInTON < amountInTON) {
        const error = `Balansda yetarli mablag' yo'q. Kerak: ${amountInTON} TON, mavjud: ${balanceInTON} TON`;
        console.log("❌", error);
        return {
          success: false,
          error,
        };
      }

      const seqno = (await wallet.methods.seqno().call()) || 0;
      console.log("Seqno:", seqno);

      const commentCell = buildCommentCell(
        "Payment for Telegram Stars/Premium"
      );

      console.log("Transfer yaratilmoqda...");
      const transfer = wallet.methods.transfer({
        secretKey: keyPair.secretKey,
        toAddress: FRAGMENT_ADDRESS,
        amount: TonWeb.utils.toNano(amountInTON.toString()),
        seqno,
        payload: commentCell,
        sendMode: 3,
      });

      console.log("Transfer yuborilmoqda...");
      await transfer.send();
      console.log("✅ Transfer yuborildi!");

      const msgCell = await transfer.getQuery();
      const msgBoc = await msgCell.toBoc(false);
      const paymentProof = TonWeb.utils.bytesToBase64(msgBoc);

      console.log("Payment proof olindigdi (length):", paymentProof.length);

      // Transaction tasdiqlashni kutish (10 soniya)
      console.log("⏳ Transaction tasdiqlashni kutish (10s)...");
      await new Promise((resolve) => setTimeout(resolve, 10000));

      console.log("✅ Withdraw muvaffaqiyatli yakunlandi\n");

      return {
        success: true,
        paymentProof,
        amountInTON,
        fromAddress: walletAddressString,
        toAddress: FRAGMENT_ADDRESS,
      };
    } catch (error) {
      console.error("❌ withdrawFromWallet error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fragment API orqali Star/Premium sotib olish
   */
  async buyFromFragment({
    username,
    productType,
    amount,
    paymentProof, // Fragment API buni talab qilmaydi
    recipientHash,
    walletType = "TON",
  }) {
    try {
      console.log("\n🛒 Fragment API bilan ishlash boshlandi");

      const type = String(productType || "").toLowerCase();

      if (!["star", "premium"].includes(type)) {
        throw new Error(
          'productType faqat "star" yoki "premium" bo\'lishi mumkin'
        );
      }

      const endpoint = FRAGMENT_ENDPOINTS[type];
      if (!endpoint) {
        throw new Error(`Fragment endpoint topilmadi (${type})`);
      }

      let body;

      if (type === "star") {
        // Star uchun - rasmiy docs bo'yicha
        body = {
          username,
          recipient_hash: recipientHash,
          quantity: amount,
          wallet_type: walletType,
          // payment_proof yuborilmaydi - Fragment o'zi tekshiradi
        };

        console.log("Star buyurtma ma'lumotlari (rasmiy docs):");
        console.log("- Username:", username);
        console.log("- Recipient hash (User ID):", recipientHash);
        console.log("- Quantity:", amount);
        console.log("- Wallet type:", walletType);
      } else {
        // Premium uchun
        body = {
          username,
          quantity: amount,
          wallet_type: walletType,
        };

        console.log("Premium buyurtma ma'lumotlari:");
        console.log("- Username:", username);
        console.log("- Quantity:", amount);
        console.log("- Wallet type:", walletType);
      }

      console.log("\n📤 Fragment API ga so'rov yuborilmoqda...");
      const data = await callFragmentApi({ endpoint, body });

      // Response tahlili
      console.log("\n📊 Fragment API javobi:");
      console.log("- Status:", data?.status || "N/A");
      console.log("- Order ID:", data?.order_id || "N/A");
      console.log("- Amount:", data?.amount || "N/A");
      console.log("- Created at:", data?.created_at || "N/A");
      console.log("- Message:", data?.message || "Xabar yo'q");
      console.log("- Error:", data?.error || "Xato yo'q");

      // Muvaffaqiyatli statuslar
      const successStatuses = ["pending", "ok", "success", "completed"];

      if (data && successStatuses.includes(data.status)) {
        console.log("✅ Fragment API muvaffaqiyatli javob berdi\n");
        return {
          success: true,
          orderId: data.order_id || data.id || null,
          status: data.status,
          amount: data.amount,
          createdAt: data.created_at,
          raw: data,
        };
      }

      // Xatolik holati
      console.log("❌ Fragment API xatolik qaytardi\n");
      return {
        success: false,
        error:
          data?.message ||
          data?.error ||
          data?.details ||
          `Fragment API noma'lum xatolik qaytardi (status: ${
            data?.status || "unknown"
          })`,
        raw: data,
      };
    } catch (error) {
      console.error("\n❌ buyFromFragment critical error:");
      console.error("Status:", error?.response?.status);
      console.error("Response data:", error?.response?.data);
      console.error("Error message:", error.message);
      console.log("");

      return {
        success: false,
        error:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.response?.data?.details ||
          error.message,
        raw: error?.response?.data,
      };
    }
  }

  /**
   * GET /api/balance
   * Wallet balansini tekshirish
   */
  async checkBalance(req, res) {
    try {
      console.log("\n💰 Balans tekshirilmoqda...");

      const { walletAddress } = await getWalletFromMnemonic();

      const balanceNano = await tonweb.getBalance(walletAddress);
      const balanceInTON = parseFloat(TonWeb.utils.fromNano(balanceNano));

      const addressString = walletAddress.toString(true, true, true);

      console.log("Wallet:", addressString);
      console.log("Balance:", balanceInTON, "TON");
      console.log("✅ Balans muvaffaqiyatli olindigdi\n");

      return res.status(200).json({
        success: true,
        data: {
          address: addressString,
          balance: balanceInTON,
          balanceNano: balanceNano.toString(),
        },
      });
    } catch (error) {
      console.error("❌ checkBalance error:", error);
      return res.status(500).json({
        success: false,
        message: "Balansni tekshirishda xatolik",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/prices
   * Barcha narxlarni qaytarish
   */
  async getPrices(req, res) {
    try {
      return res.status(200).json({
        success: true,
        data: {
          star: PRICE_TABLE.star,
          premium: PRICE_TABLE.premium,
          currency: "TON",
        },
      });
    } catch (error) {
      console.error("getPrices error:", error);
      return res.status(500).json({
        success: false,
        message: "Narxlarni olishda xatolik",
        error: error.message,
      });
    }
  }
}

export default new PaymentController();
