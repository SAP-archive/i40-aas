const { addColors, createLogger, format, transports } = require('winston');
const moment = require('moment');
const path = require('path');
const PROJECT_ROOT = path.join(
  path.join(path.join(__dirname, '..'), '..'),
  '..'
);
const { combine, timestamp, printf, json } = format;

const myFormat = () =>
  combine(
    format((log: any) => {
      if (process.env.LOGGING_LOGOUTPUT == "CONSOLE") {
        switch (log.level) {
          case "debug":
            log.level = "DBG"
            break;
          case "info":
            log.level = "INF"
            break;
          case "warn":
            log.level = "WRN"
            break;
          case "error":
            log.level = "ERR"
            break;
          default:
            log.level = log.level
            break;
        }
      }
      return log;
    })(),
    process.env.LOGGING_LOGOUTPUT == "CONSOLE" ? format.colorize() : format.uncolorize(),
    timestamp(moment().utc().format()),
    process.env.LOGGING_LOGOUTPUT == "JSON" 
      ? json({stable: false}) 
      : printf((log: any) => {
          return `${log.timestamp} ${log.level} \u001b[1m${log.caller}\u001b[0m > ${log.message} `;
        })
  );

// https://github.com/Marak/colors.js/blob/master/lib/styles.js
addColors({
  error: 'red',
  debug: 'blue',
  warn: 'yellow',
  info: 'green'
});

const logger = createLogger({
  format: myFormat(),
  transports: [
    new transports.Console({
      format: myFormat(),
      level: process.env.LOGGING_LOGLEVEL
        ? (process.env.LOGGING_LOGLEVEL as string).toLowerCase()
        : 'debug',
    }),
  ],
});

/**
 * Attempts to add file and line number info to the given log arguments.
 */
function formatLogArguments(args: any) {
  args = Array.prototype.slice.call(args);

  var stackInfo = getStackInfo(1);

  if (stackInfo) {
    // get file path relative to project root
    var calleeStr = stackInfo.relativePath + ':' + stackInfo.line;

    if (typeof args[0] === 'string') {
      args[1] = { "caller": calleeStr }
    } else {
      args.unshift(calleeStr);
    }
  }

  return args;
}

/**
 * Parses and returns info about the call stack at the given index.
 */
function getStackInfo(stackIndex: any) {
  // get call stack, and analyze it
  // get all file, method, and line numbers
  var error = new Error();
  if (error.stack) {
    var stacklist = error.stack.split('\n').slice(3);

    // stack trace format:
    // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
    // do not remove the regex expresses to outside of this method (due to a BUG in node.js)
    var stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
    var stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

    var s = stacklist[stackIndex] || stacklist[0];
    var sp = stackReg.exec(s) || stackReg2.exec(s);

    if (sp && sp.length === 5) {
      return {
        method: sp[1],
        relativePath: path.relative(PROJECT_ROOT, sp[2]),
        line: sp[3],
        pos: sp[4],
        file: path.basename(sp[2]),
        stack: stacklist.join('\n'),
      };
    }
  }
}

module.exports.debug = module.exports.log = function () {
  logger.debug.apply(logger, formatLogArguments(arguments));
};

module.exports.info = function () {
  logger.info.apply(logger, formatLogArguments(arguments));
};

module.exports.warn = function () {
  logger.warn.apply(logger, formatLogArguments(arguments));
};

module.exports.error = function () {
  logger.error.apply(logger, formatLogArguments(arguments));
};
