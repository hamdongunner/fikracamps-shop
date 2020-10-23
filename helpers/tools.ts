import * as bcrypt from "bcrypt";

/**
 *
 * @param res
 * @param err
 * @param statusCode
 */
const errRes = (res, err, statusCode = 400) => {
  let response = { status: false, err };
  res.statusCode = statusCode;
  return res.json(response);
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

export { errRes, okRes, getOTP, hashMyPassword, comparePassword, paginate };
