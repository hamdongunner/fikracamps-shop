import { Request, Response } from "express";
import { okRes, errRes, getOTP } from "../../helpers/tools";
import * as validate from "validate.js";
import validation from "../../helpers/validation.helper";
import { User } from "../../src/entity/User";
import PhoneFormat from "../../helpers/phone.helper";

/**
 *
 */
export default class UserController {
  /**
   *
   * @param req
   * @param res
   */
  static async register(req: Request, res: Response): Promise<object> {
    let notValid = validate(req.body, validation.register());
    if (notValid) return errRes(res, notValid);
    let phoneObj = PhoneFormat.getAllFormats(req.body.phone);
    if (!phoneObj.isNumber)
      return errRes(res, `Phone ${req.body.phone} is not a valid`);

    let user: any;

    try {
      user = await User.findOne({ where: { phone: req.body.phone } });
      if (user) return errRes(res, `Phone ${req.body.phone} already exists`);
    } catch (error) {
      return errRes(res, error);
    }

    // TODO: create JWT Token
    // TODO: Hash the password
    // TODO: send the SMS

    user = await User.create({
      ...req.body,
      active: true,
      complete: false,
      otp: getOTP(),
    });

    await user.save();

    return okRes(res, { data: user });
  }
}
