import { Request, Response, NextFunction, Router } from "express";
import * as ErrorHandler from "../utils/ErrorHandler";

//the way you handle 404 in express. By adding a fallback middleware if nothing else was found
//We don’t handle 404 error in its middleware — we directly propagate it further for a dedicated client errors handler.
const handle404Error = (router: Router) => {
  router.use((req: Request, res: Response) => {
    ErrorHandler.notFoundError();
  });
};
  // handleClientErrors catches client API errors like Bad request or Unauthorized
//We’re looking only for 4xx HTTP errors and if it’s not a case we propagate it down the chain.
  const handleClientError = (router: Router) => {
  router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    ErrorHandler.clientError(err, res, next);
  });
};
//handleServerErrors a place to handle “Internal Server Error”.
//last resort for handling errors, we must handle it here, or uncaughtException handler will be called, and this node process will be finished.
const handleServerError = (router: Router) => {
  router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    ErrorHandler.serverError(err, res, next);
  });
};

export default [handle404Error, handleClientError, handleServerError];
