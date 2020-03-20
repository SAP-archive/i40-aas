import * as logger from "winston";

let LOGGING_LOGLEVEL: string | undefined = process.env.LOGGING_LOGLEVEL;
if (!LOGGING_LOGLEVEL) {
  LOGGING_LOGLEVEL = "debug"
}

logger.configure({
  transports: [
    new logger.transports.Console({
      level: LOGGING_LOGLEVEL.toLowerCase()
    })
  ]
});

export { logger };
