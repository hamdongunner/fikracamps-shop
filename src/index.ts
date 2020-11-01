import * as express from "express";
import { createConnection } from "typeorm";
import { errRes } from "../helpers/tools";
import * as morgan from "morgan";
const app = express();
const port = process.env.PORT || 3000;
import v1 from "../route/app/v1";
import * as fileUpload from "express-fileupload";

createConnection().then(async (connection) => {
  app.use(fileUpload({}));
  app.use(express.json());
  app.use(morgan("dev"));

  app.use("/v1", v1);

  // 404

  app.use((req, res, next) => {
    return errRes(res, "404 Not found", "404", 404);
  });
  app.listen(port, () => {
    console.log(`Running on port ${port}`);
  });
});
