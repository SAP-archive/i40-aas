import { Router } from "express";
import cors from "cors";
import parser from "body-parser";
import compression from "compression";
import { logger } from "../utils/log";

import * as basicAuth from "express-basic-auth";



const dotenv = require("dotenv");
dotenv.config();

let DATAMANAGER_USER: string | undefined = process.env.DATA_MANAGER_USER;
let DATAMANAGER_PASS: string | undefined = process.env.DATA_MANAGER_PASSWORD;

if (DATAMANAGER_USER === undefined) {
  logger.error(" [Basic auth] No  username was found in environment");
}
if (DATAMANAGER_PASS === undefined) {
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
if (DATAMANAGER_USER && DATAMANAGER_PASS) {
  user[DATAMANAGER_USER] = DATAMANAGER_PASS;
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