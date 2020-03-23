import { HTTPClientError, HTTP404Error, HTTP400Error } from "./httpErrors";
import { logger } from "./log";
import { Request, Response, NextFunction } from "express";


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
  logger.debug("instance "+ err.name )
  if (err instanceof HTTPClientError ) {
    logger.error("Client error "+err);
    res.status(err.statusCode).send(err.message);
  }
  else if (err instanceof SyntaxError){
    logger.error("Syntax error" + err);
    res.status(400).send(err.message);
  }
  else {
    next(err);
  }
};

export const serverError = (err: Error, res: Response, next: NextFunction) => {
  logger.error("Server error " +err);
  if (process.env.NODE_ENV === "production") {
    res.status(500).send("Internal Server Error");
  } else {
    res.status(500).send(err.stack);
  }
};
