import * as logger from "winston";

logger.configure({
  transports: [
    new logger.transports.Console({
      level: process.env.logLevel || "debug"
    })
  ]
});

export { logger };
