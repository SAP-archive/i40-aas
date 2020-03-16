import * as logger from "winston";

logger.configure({
  transports: [
    new logger.transports.Console({
      level: process.env.LOGGING_LOGLEVEL || "debug"
    })
  ]
});

export { logger };
