import * as express from "express";
import { createConnection } from "typeorm";
import { errRes } from "../helpers/tools";
const app = express();
const port = process.env.PORT || 3000;
import v1 from "../route/app/v1";
import { env } from "process";

createConnection().then(async (connection) => {
  app.use(express.json());

  app.use("/v1", v1);

  // 404

  app.use((req, res, next) => {
    return errRes(res, "404 Not found");
  });
  app.listen(port, () => {
    console.log(`Running on port ${port}`);
  });
});
