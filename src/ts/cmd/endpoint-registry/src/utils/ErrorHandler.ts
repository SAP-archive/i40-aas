import { Response, NextFunction } from "express";
import {
  HTTPClientError,
  HTTP404Error,
  HTTP400Error
} from "../utils/httpErrors";
import { logger } from "../utils/log";

/**
 * This class offers a dedicated object which encapsulates the logic of how we manage errors
 * .
 */

export const notFoundError = () => {
  throw new HTTP404Error("Method not found.");
};

export const badRequestError = () => {
  throw new HTTP400Error("Bad Request");
};

export const clientError = (err: Error, res: Response, next: NextFunction) => {
  //logger.debug("Error_object " + err.name);
  if (err instanceof HTTPClientError) {
    logger.error("Client error " + err);
    res.status(err.statusCode).send(err.message);
  } else if (err instanceof SyntaxError) {
    logger.error("Syntax error" + err);
    res.status(400).send(err.message);
  } else {
    next(err);
  }
};

export const serverError = (err: Error, res: Response, next: NextFunction) => {
  logger.error("Server error " + err);
  res.status(500).send("Internal Server Error");
};
