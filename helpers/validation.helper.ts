/**
 *
 */
export default class Validator {
  /**
   *
   * @param must: boolean
   */
  static register = (must = true) => ({
    name: {
      presence: must,
      type: "string",
    },
    phone: {
      presence: must,
      type: "string",
      length: { maximum: 15, minimum: 10 },
    },
    password: {
      presence: must,
      type: "string",
      length: { maximum: 15, minimum: 4 },
    },
  });

  /**
   *
   * @param must: boolean
   */
  static otp = (must = true) => ({
    otp: {
      presence: must,
      type: "number",
    },
  });

  /**
   *
   * @param must: boolean
   */
  static login = (must = true) => ({
    phone: {
      presence: must,
      type: "string",
      length: { maximum: 15, minimum: 10 },
    },
    password: {
      presence: must,
      type: "string",
      length: { maximum: 15, minimum: 4 },
    },
  });
}
