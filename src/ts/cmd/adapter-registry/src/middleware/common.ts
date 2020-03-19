import { Router } from "express";
import cors from "cors";
import parser from "body-parser";
import compression from "compression";
import * as basicAuth from "express-basic-auth";
import { logger } from "../utils/log";

const dotenv = require("dotenv");
dotenv.config();

let CORE_REGISTRIES_ADAPTERS_USER: string | undefined =
  process.env.CORE_REGISTRIES_ADAPTERS_USER;
let CORE_REGISTRIES_ADAPTERS_PASSWORD: string | undefined =
  process.env.CORE_REGISTRIES_ADAPTERS_PASSWORD;

if (CORE_REGISTRIES_ADAPTERS_USER === undefined) {
  logger.error(" [Basic auth] No  username was found in environment");
}
if (CORE_REGISTRIES_ADAPTERS_PASSWORD === undefined) {
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
if(CORE_REGISTRIES_ADAPTERS_USER && CORE_REGISTRIES_ADAPTERS_PASSWORD){
  user[CORE_REGISTRIES_ADAPTERS_USER] =
  CORE_REGISTRIES_ADAPTERS_PASSWORD;
}

export const handleBasicAuth = (router: Router) =>
  router.use(
    basicAuth.default({
      users: user,
      challenge: true
    })
  );
