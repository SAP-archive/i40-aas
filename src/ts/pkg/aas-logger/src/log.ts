const { createLogger, format, transports } = require('winston');
const moment = require('moment');
const path = require('path');
const PROJECT_ROOT = path.join(
  path.join(path.join(__dirname, '..'), '..'),
  '..'
);
const { combine, timestamp, label, printf } = format;

const myFormat = (color?: boolean) =>
  format.combine(
    format((info: any) => {
      info.level = info.level.toUpperCase();
      return info;
    })(),
    color ? format.colorize() : format.uncolorize(),
    format((info: any) => {
      info.timestamp = moment().format('YYYY-MM-DDTHH:mm:ss');
      return info;
    })(),

    format.printf((info: any) => {
      const { timestamp, level, message, ...args } = info;
      return `${timestamp} ${level} ${info.message} `;
    })
  );

const logger = createLogger({
  format: myFormat(),
  transports: [
    new transports.Console({
      format: myFormat(true),
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
    var calleeStr = ' ' + stackInfo.relativePath + ':' + stackInfo.line + ' > ';

    if (typeof args[0] === 'string') {
      args[0] = calleeStr + ' ' + args[0];
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
