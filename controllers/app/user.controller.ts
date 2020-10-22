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
import { Product } from "../../src/entity/Product";
import { Invoice } from "../../src/entity/Invoice";
import { InvoiceItem } from "../../src/entity/InvoiceItem";
import * as ZC from "zaincash";

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
      user = await User.findOne({ where: { phone } });
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

    const paymentData = {
      amount: total,
      orderId: invoice.id,
      serviceType: "FikraCamps Shop",
      redirectUrl: "http://localhost:3000/v1/zc/redirect",
      production: false,
      msisdn: config.zcMsisdn,
      merchantId: config.zcMerchant,
      secret: config.zcSecret,
      lang: "ar",
    };

    let zc = new ZC(paymentData);

    let zcTransactionId: any;
    try {
      zcTransactionId = await zc.init();
    } catch (error) {
      return errRes(res, error);
    }

    let url = `https://test.zaincash.iq/transaction/pay?id=${zcTransactionId}`;
    invoice.zcTransactionId = zcTransactionId;
    await invoice.save();

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

    return okRes(res, { data: { invoice, url } });
  }

  /**
   *
   * @param req
   * @param res
   */
  static async forgetPassword(req, res): Promise<object> {
    // validation
    let notValid = validate(req.body, validation.forgetPassword());
    if (notValid) return errRes(res, notValid);

    let phoneObj = PhoneFormat.getAllFormats(req.body.phone);
    if (!phoneObj.isNumber)
      return errRes(res, `Phone ${req.body.phone} is not a valid`);
    let phone = phoneObj.globalP;

    // get user from database where phone, complete: true, active: true -> if not err

    let user: any;
    try {
      user = await User.findOne({
        where: { phone, complete: true, active: true },
      });

      if (!user) return errRes(res, `Please complete the registration process`);
    } catch (error) {
      return errRes(res, error);
    }

    // create and save the verifyPassword
    user.verifyPassword = getOTP();
    await user.save();
    // send it in SMS TODO:
    // create the token NOT LIKE THE LOGIN TOKEN
    const token = jwt.sign({ phone }, config.jwtSecret);
    // return
    return okRes(res, { data: { token } });
  }

  /**
   *
   * @param req
   * @param res
   */
  static async verifyPassword(req, res): Promise<object> {
    // validation
    let notValid = validate(req.body, validation.verifyPassword());
    if (notValid) return errRes(res, notValid);

    // get the token from headers -> if not return `please send the token`
    const token = req.headers.token;
    if (!token) return errRes(res, `please send the token`);
    // get payload -> phone
    let payload: any;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch (error) {
      return errRes(res, error);
    }
    const phone = payload.phone;

    // get the user from
    let user = await User.findOne({
      where: { phone, complete: true, active: true },
    });

    if (!user) return errRes(res, `Please complete the registration process`);

    // compare the verifyPassword text -> delete from DB
    if (user.verifyPassword != req.body.verifyPassword) {
      user.verifyPassword = null;
      await user.save();
      return errRes(res, `The code ${req.body.verifyPassword} is not correct`);
    }
    // hash and set to the new password
    user.password = await hashMyPassword(req.body.newPassword);
    await user.save();

    return okRes(res, { data: { msg: "All good " } });
  }

  /**
   *
   * @param req
   * @param res
   */
  static async zcRedirect(req, res): Promise<object> {
    const token = req.query.token;

    let payload: any;
    try {
      payload = jwt.verify(token, config.zcSecret);
    } catch (error) {
      return errRes(res, error);
    }
    const id = payload.orderid;

    let invoice = await Invoice.findOne(id);

    if (!invoice) return errRes(res, "No such invoice");

    if (payload.status == "success") {
      invoice.status = "paid";
      invoice.zcOperation = payload.operationid;
      invoice.zcMsisdn = payload.msisdn;
      await invoice.save();
      return okRes(res, { invoice });
    }
    invoice.status = payload.status;
    invoice.zcOperation = payload.operationid;
    invoice.zcMsg = payload.msg;
    await invoice.save();

    return errRes(res, { data: { invoice } });
  }
}
