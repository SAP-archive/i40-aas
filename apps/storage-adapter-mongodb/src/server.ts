import express from "express";
import { applyMiddleware, applyRoutes } from "./utils";
import routes from "./services";
import middleware from "./middleware";
import errors from "./error-handling";

//Do not remove the next line as it initializes the logger
const initializeLogger = require("./log");
const router = express();
applyMiddleware(middleware, router);
applyRoutes(routes, router);
applyMiddleware(errors, router);

const PORT = 3100;
//const server = http.createServer(router);

router.listen(PORT, () => {
  console.log(
    `A Server is running http://localhost:${PORT}...`
  );
  router.emit("app_started");
});

export { router as app };
