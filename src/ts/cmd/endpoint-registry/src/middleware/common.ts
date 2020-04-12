import { Router } from "express";
import cors from "cors";
import parser from "body-parser";
import compression from "compression";
import * as basicAuth from "express-basic-auth";
 const dotenv = require('dotenv');
 dotenv.config();

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
if (process.env.CORE_REGISTRIES_ENDPOINTS_USER && process.env.CORE_REGISTRIES_ENDPOINTS_PASSWORD) {
  user[process.env.CORE_REGISTRIES_ENDPOINTS_USER] = process.env.CORE_REGISTRIES_ENDPOINTS_PASSWORD;
}
export const handleBasicAuth = (router: Router) =>
  router.use(
    basicAuth.default({
      users: user,
      challenge: true
    })
  );
