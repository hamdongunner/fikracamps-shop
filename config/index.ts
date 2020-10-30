require("dotenv").config();

let config: any;
export default config = {
  jwtSecret: process.env.JWT_SECRET || "shhh",
  zcSecret: process.env.ZC_SECRET || "shhh",
  zcMsisdn: process.env.ZC_MSISDN || "",
  zcProduction: process.env.ZC_PRODUCTION || false,
  zcMerchant: process.env.ZC_MERCHANT || "",
  imageBB: process.env.IMAGE_BB || "",
};
