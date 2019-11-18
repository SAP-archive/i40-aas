import { Router } from "express";
import cors from "cors";
import parser from "body-parser";
import compression from "compression";
import * as basicAuth from "express-basic-auth";
import { logger } from "../utils/log";

const dotenv = require("dotenv");
dotenv.config();

let ADAPTER_REGISTRY_ADMIN_USER: string | undefined =
  process.env.ADAPTER_REGISTRY_ADMIN_USER;
let ADAPTER_REGISTRY_ADMIN_PASSWORD: string | undefined =
  process.env.ADAPTER_REGISTRY_ADMIN_PASSWORD;

if (ADAPTER_REGISTRY_ADMIN_USER === undefined) {
  logger.error(" [Basic auth] No  username was found in environment");
}
if (ADAPTER_REGISTRY_ADMIN_PASSWORD === undefined) {
  logger.error(" [Basic auth] No  password was found in environment");
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
if(ADAPTER_REGISTRY_ADMIN_USER && ADAPTER_REGISTRY_ADMIN_PASSWORD){
  user[ADAPTER_REGISTRY_ADMIN_USER] =
  ADAPTER_REGISTRY_ADMIN_PASSWORD;
}

export const handleBasicAuth = (router: Router) =>
  router.use(
    basicAuth.default({
      users: user,
      challenge: true
    })
  );
