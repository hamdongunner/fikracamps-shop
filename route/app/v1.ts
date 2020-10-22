import * as express from "express";
const router = express.Router();
import userAuth from "../../middleware/app/userAuth";

import UserController from "../../controllers/app/user.controller";
import HomeController from "../../controllers/app/home.controller";

// USER CONTROLLER
router.post("/register", UserController.register);
router.post("/otp", UserController.checkOTP);
router.post("/login", UserController.login);
router.post("/invoice", userAuth, UserController.makeInvoice);
router.post("/forget", UserController.forgetPassword);
router.post("/verify", UserController.verifyPassword);
router.get("/zc/redirect", UserController.zcRedirect);

// HOME CONTROLLERproducts
router.get("/categories", HomeController.getCategories);
router.get("/products/:category", HomeController.getProducts);
router.get("/methods", HomeController.getMethods);
router.get("/invoices", userAuth, HomeController.getInvoices);

export default router;
