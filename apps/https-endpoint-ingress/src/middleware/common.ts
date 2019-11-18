import { Router } from "express";
import cors from "cors";
import parser from "body-parser";
import compression from "compression";
import * as basicAuth from "express-basic-auth";
import { logger } from "../utils/log";

const dotenv = require("dotenv");
dotenv.config();

let HTTPS_ENDPOINT_INGRESS_USER: string | undefined = process.env.HTTPS_ENDPOINT_INGRESS_USER;
let HTTPS_ENDPOINT_INGRESS_PASSWORD: string | undefined = process.env.HTTPS_ENDPOINT_INGRESS_PASSWORD;

if (!HTTPS_ENDPOINT_INGRESS_USER) {
  logger.error(" [Basic auth] No  username was found in environment");
}
if (!HTTPS_ENDPOINT_INGRESS_PASSWORD) {
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
if (HTTPS_ENDPOINT_INGRESS_USER && HTTPS_ENDPOINT_INGRESS_PASSWORD) {
  user[HTTPS_ENDPOINT_INGRESS_USER] = HTTPS_ENDPOINT_INGRESS_PASSWORD;
} else {
  logger.info("One or more env variable not set, exiting service");
  //TODO: check why process does not exit on some occasions (npn run script?)
  process.exit(1);
}

export const handleBasicAuth = (router: Router) =>
  router.use(
    basicAuth.default({
      users: user,
      challenge: true
    })
  );
