import * as bcrypt from "bcrypt";
const accountSid = "AC46336a3d11a0e49637857ec2dfdc5d7c";
const authToken = "9438765f28d5b393e41cf41e70e5ca45";
import * as twilio from "twilio";
const client = twilio(accountSid, authToken);

/**
 *
 * @param res
 * @param err
 * @param statusCode
 */
const errRes = (
  res,
  err,
  key = "err",
  statusCode = 400,
  lang = "ar",
  errValue = ""
) => {
  let response = { status: false, err: null };
  if (typeof err === "string") {
    err = tranlation(err, lang, errValue) || err;
    let obj = {};
    obj[key] = [err];
    response.err = obj;
  } else {
    response.err = err;
  }

  res.statusCode = statusCode;
  return res.json(response);
};

const tranlation = (err, lang, value = "") => {
  let defaultMsg = {
    en: "Something went wrong",
    ar: "لقد حدث خطأ ما",
  };
  return (
    {
      en: {
        phoneInvalid: `Phone ${value} is invalid`,
      },
      ar: {
        phoneInvalid: `الرقم ${value} غير صالح`,
      },
    }[lang][err] || defaultMsg[lang]
  );
};

/**
 *
 * @param res
 * @param data
 * @param statusCode
 */
const okRes = (res, data, statusCode = 200) => {
  let response = { status: true, data };
  res.statusCode = statusCode;
  return res.json(response);
};

const getOTP = () => Math.floor(1000 + Math.random() * 9000);

/**
 *
 * @param {*} plainPassword
 */
const hashMyPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash(plainPassword, salt);
  return password;
};

/**
 *
 * @param {*} plainPassword
 */
const comparePassword = async (plainPassword, hash) =>
  await bcrypt.compare(plainPassword, hash);

/**
 *
 * @param p
 * @param s
 */
const paginate = (p = 1, s = 10) => {
  let take = s;
  let skip = (p - 1) * take;
  return { take, skip };
};

const sendSMS = (body: string, to: string) => {
  client.messages
    .create({ body, from: "+12563641871", to })
    .then((message) => console.log(message.sid));
};

export {
  // * as
  errRes,
  okRes,
  getOTP,
  hashMyPassword,
  comparePassword,
  paginate,
  sendSMS,
};
