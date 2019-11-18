import { Router } from "express";
import cors from "cors";
import parser from "body-parser";
import compression from "compression";
import * as basicAuth from "express-basic-auth";

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
if (process.env.ENDPOINT_REGISTRY_ADMIN_USER && process.env.ENDPOINT_REGISTRY_ADMIN_PASSWORD) {
  user[process.env.ENDPOINT_REGISTRY_ADMIN_USER] = process.env.ENDPOINT_REGISTRY_ADMIN_PASSWORD;
}
export const handleBasicAuth = (router: Router) =>
  router.use(
    basicAuth.default({
      users: user,
      challenge: true
    })
  );
