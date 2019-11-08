import { Router } from "express";
import cors from "cors";
import parser from "body-parser";
import compression from "compression";
import { logger } from "../utils/log";

import * as basicAuth from "express-basic-auth";



const dotenv = require("dotenv");
dotenv.config();

let DATA_MANAGER_USER: string | undefined = process.env.DATA_MANAGER_USER;
let DATA_MANAGER_PASSWORD: string | undefined = process.env.DATA_MANAGER_PASSWORD;

if (!DATA_MANAGER_USER  || !DATA_MANAGER_PASSWORD) {
  logger.error(" [Basic auth] No  username or password was found in environment");
}



export const handleCors = (router: Router) =>
  router.use(cors({ credentials: true, origin: true }));

export const handleBodyRequestParsing = (router: Router) => {
  router.use(parser.urlencoded({ extended: true }));
  router.use(parser.json());
};

export const handleCompression = (router: Router) => {
  router.use(compression());
};

let user: any = {};
if (DATA_MANAGER_USER && DATA_MANAGER_PASSWORD) {
  user[DATA_MANAGER_USER] = DATA_MANAGER_PASSWORD;
}
export const handleBasicAuth = (router: Router) =>
  router.use(
    basicAuth.default({
      users: user,
      challenge: true
    })
  );