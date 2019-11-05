import { Router } from "express";
import express = require("express");
import boom = require("boom");
import * as logger from "winston";

let parserErrorHandler: express.ErrorRequestHandler = function(
  err,
  req,
  res,
  next
) {
  if (err.statusCode && err.statusCode === 400) {
    logger.debug(err.message);
    next(boom.badRequest(err.message));
  }
  next(err);
};

export const handleParserErrors = (router: Router) => {
  router.use(parserErrorHandler);
};

let boomErrorHandler: express.ErrorRequestHandler = function(
  err,
  req,
  res,
  next
) {
  if (!err.isBoom) {
    next(err);
  }
  return res.status(err.output.statusCode).json(err.output.payload);
};

export const handleBoomErrors = (router: Router) => {
  router.use(boomErrorHandler);
};
