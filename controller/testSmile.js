// testSmile.js
const { getProductList, getRole, createOrder } = require("./smileClient");

(async () => {
  try {
    // 1) Product list
    const productResp = await getProductList("mobilelegends");
    console.log("PRODUCT LIST RESPONSE:");
    console.dir(productResp, { depth: null });

    const firstProduct = productResp?.data?.product?.[0];
    if (!firstProduct) {
      console.log("Mahsulot topilmadi");
      return;
    }

    const productid = firstProduct.id;
    console.log("Tanlangan productid:", productid);

    // Sandbox test userlari (dokumentdagi) :contentReference[oaicite:5]{index=5}
    const userid = "17366";
    const zoneid = "22001";
    const product = "mobilelegends";

    // 2) Role tekshirish
    const roleResp = await getRole({
      userid,
      zoneid,
      product,
      productid,
    });

    console.log("GETROLE RESPONSE:");
    console.dir(roleResp, { depth: null });

    // 3) Buyurtma yaratish
    const orderResp = await createOrder({
      userid,
      zoneid,
      product,
      productid,
    });

    console.log("CREATEORDER RESPONSE:");
    console.dir(orderResp, { depth: null });
  } catch (e) {
    if (e.response) {
      console.log("Status:", e.response.status);
      console.log("Headers:", e.response.headers);
      console.log("Body:", e.response.data);
    } else {
      console.log("Error message:", e.message);
    }
  }
})();
