import * as express from "express";
const router = express.Router();

import UserController from "../../controllers/app/user.controller";

// create v1
//// register
router.post("/register", UserController.register);

//// login
//// categories
//// category products
//// check out
//// invoices
//// methods
//// notifications

export default router;
