import { Request, Response } from "express";
import {
  okRes,
  errRes,
  getOTP,
  hashMyPassword,
  comparePassword,
} from "../../helpers/tools";
import * as validate from "validate.js";
import validation from "../../helpers/validation.helper";
import { User } from "../../src/entity/User";
import PhoneFormat from "../../helpers/phone.helper";
import * as jwt from "jsonwebtoken";
import config from "../../config";
import { async } from "validate.js";
import { Product } from "../../src/entity/Product";
import { Invoice } from "../../src/entity/Invoice";
import { InvoiceItem } from "../../src/entity/InvoiceItem";

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
    let phone = phoneObj.globalP;
    let user: any;
    try {
      user = await User.findOne({ where: { phone: req.body.phone } });
      if (user) {
        if (user.complete)
          return errRes(res, `Phone ${req.body.phone} already exists`);
        const token = jwt.sign({ id: user.id }, config.jwtSecret);
        user.otp = getOTP();
        await user.save();
        user.password = null;
        user.otp = null;
        return okRes(res, { data: { user, token } });
      }
    } catch (error) {
      return errRes(res, error);
    }
    const password = await hashMyPassword(req.body.password);
    user = await User.create({
      ...req.body,
      active: true,
      complete: false,
      otp: getOTP(),
      password,
      phone,
    });
    await user.save();
    user.password = null;
    user.otp = null;
    // TODO: send the SMS

    const token = jwt.sign({ id: user.id }, config.jwtSecret);
    return okRes(res, { data: { user, token } });
  }

  /**
   *
   * @param req
   * @param res
   */
  static checkOTP = async (req, res): Promise<object> => {
    // validation
    let notValid = validate(req.body, validation.otp());
    if (notValid) return errRes(res, notValid);

    // get token from headers
    const token = req.headers.token;
    let payload: any;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch (error) {
      return errRes(res, "Invalid Token");
    }
    // get user from DB
    let user = await User.findOne(payload.id);
    if (!user) return errRes(res, "User does not exist");
    // check if user complete = true
    if (user.complete) return errRes(res, "User already complete");
    // compare the OTPs
    if (user.otp != req.body.otp) {
      user.otp = null;
      await user.save();
      return errRes(res, `The OTP ${req.body.otp} is not correct`);
    }
    // complete = true
    user.complete = true;
    await user.save();
    user.password = null;
    // return

    return okRes(res, { data: { user } });
  };

  /**
   *
   * @param req
   * @param res
   */
  static async login(req, res): Promise<object> {
    // validation
    let notValid = validate(req.body, validation.login());
    if (notValid) return errRes(res, notValid);

    // phone format
    let phoneObj = PhoneFormat.getAllFormats(req.body.phone);
    if (!phoneObj.isNumber)
      return errRes(res, `Phone ${req.body.phone} is not a valid`);
    const phone = phoneObj.globalP;

    // findOne user from DB using phone
    let user = await User.findOne({ where: { phone } });
    if (!user) return errRes(res, `Phone ${phone} is not registered`);
    // compare the password
    let validPassword = await comparePassword(req.body.password, user.password);
    if (!validPassword) return errRes(res, `Please check your data`);

    // create token
    const token = jwt.sign({ id: user.id }, config.jwtSecret);

    // return

    return okRes(res, { data: { token } });
  }

  /**
   *
   * @param req
   * @param res
   */
  static async makeInvoice(req, res): Promise<object> {
    // validation
    let notValid = validate(req.body, validation.makeInvoice());
    if (notValid) return errRes(res, notValid);

    let ids = [];
    for (const iterator of req.body.products) {
      let notValid = validate(iterator, validation.oneProduct());
      if (notValid) return errRes(res, notValid);
      ids.push(iterator.id);
    }

    // get the user let user = req.user
    let user = req.user;

    // get the products from DB
    let products = await Product.findByIds(ids);

    [
      { id: 1, quantity: 2 },
      { id: 2, quantity: 1 },
    ];
    let total = 0;
    //  calculate the total from the products
    for (const product of products) {
      total =
        total +
        product.price *
          req.body.products.filter((e) => e.id == product.id)[0].quantity;
    }

    // create the invoice & save
    let invoice: any;
    invoice = await Invoice.create({
      ...req.body,
      total,
      status: "pending",
      user,
    });
    await invoice.save();

    // create ZC things

    // create the invoice items
    for (const product of products) {
      let invoiceItem = await InvoiceItem.create({
        quantity: req.body.products.filter((e) => e.id == product.id)[0]
          .quantity,
        invoice,
        subtotal:
          req.body.products.filter((e) => e.id == product.id)[0].quantity *
          product.price,
        product,
      });
      await invoiceItem.save();
    }

    return okRes(res, { data: { invoice } });
  }
}
