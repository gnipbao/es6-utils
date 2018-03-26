import storage from "./storage";

let noop = () => {};
let stringify = str => {
  let ret = "";
  try {
    ret = JSON.stringify(str);
  } catch (error) {}
  return ret;
};

const LEVELS = {
  TRACE: { value: 1, name: "TRACE" },
  DEBUG: { value: 2, name: "DEBUG" },
  INFO: { value: 3, name: "INFO" },
  TIME: { value: 4, name: "TIME" },
  WARN: { value: 5, name: "WARN" },
  ERROR: { value: 8, name: "ERROR" },
  OFF: { value: 99, name: "OFF" }
};
const STYLE = {
  normal: "#FFA500",
  debug: "#9AA2AA",
  info: "#659AD2",
  warn: "#F9C749",
  error: "#EC3D47"
};

const LOG_STORE_KEY = "LOG_STORE_KEY";
const LOG_LEVEL = storage.get("LOG_LEVEL") || LEVELS.DEBUG;
let lastWriteMsgDigest = "";
let defaultOptions = { filterLevel: LEVELS.DEBUG }; // default options
let logHandler; // handler of log
// store for log message
let logMessages = "";
let pad = (number, length) => {
  let pre = "",
    negative = number < 0,
    string = String(Math.abs(number));

  if (string.length < length)
    pre = new Array(length - string.length + 1).join("0");
  return (negative ? "-" : "") + pre + string;
};

let timeLabel = () => {
  let date = new Date();
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1, 2) +
    "-" +
    pad(date.getDate(), 2) +
    " " +
    pad(date.getHours(), 2) +
    ":" +
    pad(date.getMinutes(), 2) +
    ":" +
    pad(date.getSeconds(), 2)
  );
};

class Logger {
  constructor(name, options) {
    this.name = name; // module name
    this.formatter = noop();
    this._init(options);
  }

  _init(options) {
    this._setOptions(options);
    this.setLevel(
      (options && options.filterLevel) || defaultOptions.filterLevel
    );
    Logger.setHandler(this._defaultLogHandler());
  }

  _setOptions(options) {
    this.options = options || defaultOptions;
    this.formatter =
      this.options.formatter ||
      function defaultMessageFormatter(messages, context) {
        // Prepend the logger's name to the log message for easy identification.
        messages.unshift("%c ");
        if (context.name) {
          messages.unshift("%c[" + context.name + "]");
        }
        messages.unshift(
          "%c[" + timeLabel() + "]%c[" + context.level.name + "]"
        );
      };
  }

  static setHandler(fn) {
    logHandler = fn;
  }

  static getLog() {
    return logMessages;
  }
  // persistent log in localstorage
  static persistent(flag = true) {
    let self = this;
    let timer;
    if (flag === false) {
      clearInterval(timer);
      return;
    }
    timer = setInterval(function() {
      let curMsgDigest = logMessages;
      if (curMsgDigest !== lastWriteMsgDigest) {
        lastWriteMsgDigest = curMsgDigest;
        storage.set(LOG_STORE_KEY, logMessages);
      }
    }, 30 * 1000);
  }

  _defaultLogHandler() {
    let self = this;
    // background color.
    let bgColor = STYLE.normal;
    // Map of timestamps by timer labels used to track `#time` and `#timeEnd()` invocations in environments
    // that don't offer a native console method.
    let timerStartTimeByLabelMap = {};

    // Support for IE8+ (and other, slightly more sane environments)
    let invokeConsoleMethod = function(hdlr, messages) {
      Function.prototype.apply.call(hdlr, console, messages);
    };

    // Check for the presence of a logger.
    if (typeof console === "undefined") {
      return function() {
        /* no console */
      };
    }
    return function(messages, context) {
      // Convert arguments object to Array.
      messages = [...messages];

      // formatter messages
      self.formatter(messages, context);

      // persistent log by memory store.
      let msg = logMessages || "";
      logMessages =
        (msg !== "" ? msg + "\n" : "") +
        messages.join("").replace(/(%c)/gi, "");

      let hdlr = console.log;
      let timerLabel;

      if (context.level === LEVELS.TIME) {
        timerLabel =
          (context.name ? "[" + context.name + "] " : "") +
          messages[messages.length - 2];

        if (messages[messages.length - 1] === "start") {
          timerStartTimeByLabelMap[timerLabel] = new Date().getTime();
        } else {
          invokeConsoleMethod(hdlr, [
            timerLabel +
              ": %c" +
              (new Date().getTime() - timerStartTimeByLabelMap[timerLabel]) +
              "ms",
            "background-color:#fff;color:red;"
          ]);
        }
      } else {
        // Delegate through to custom warn/error loggers if present on the console.
        if (context.level === LEVELS.WARN && console.warn) {
          hdlr = console.warn;
          bgColor = STYLE.warn;
        } else if (context.level === LEVELS.ERROR && console.error) {
          hdlr = console.error;
          bgColor = STYLE.error;
        } else if (context.level === LEVELS.INFO && console.info) {
          hdlr = console.info;
          bgColor = STYLE.info;
        } else if (context.level === LEVELS.DEBUG && console.debug) {
          hdlr = console.debug;
          bgColor = STYLE.debug;
        } else if (context.level === LEVELS.TRACE && console.trace) {
          hdlr = console.trace;
          bgColor = STYLE.normal;
        }

        let styleConsole = [
          messages.join("") + " ",
          "background-color:#006b75;color:#fff;",
          "background-color:#fff;color:" + bgColor + ";",
          "background-color:#82e5e2;color:#000",
          "background-color:" + bgColor + ";color:#fff;"
        ];

        if (!context.name) styleConsole.splice(2, 1);

        invokeConsoleMethod(hdlr, styleConsole);
      }
    };
  }

  setLevel(newLevel) {
    // Changes the current logging level for the logging instance.
    // Ensure the supplied Level object looks valid.
    if (newLevel && "value" in newLevel) {
      this.options.filterLevel = newLevel;
    }
  }

  getLevel() {
    return this.options.filterLevel;
  }

  enabledFor(lvl) {
    let filterLevel = this.options.filterLevel;
    return lvl.value >= filterLevel.value;
  }

  trace() {
    this.invoke(LEVELS.TRACE, arguments);
  }

  debug() {
    this.invoke(LEVELS.DEBUG, arguments);
  }

  info() {
    this.invoke(LEVELS.INFO, arguments);
  }

  warn() {
    this.invoke(LEVELS.WARN, arguments);
  }

  error() {
    this.invoke(LEVELS.ERROR, arguments);
  }

  time(label) {
    if (typeof label === "string" && label.length > 0)
      this.invoke(LEVELS.TIME, [label, "start"]);
  }

  timeEnd(label) {
    if (typeof label === "string" && label.length > 0)
      this.invoke(LEVELS.TIME, [label, "end"]);
  }
  // invokes the logger callback
  invoke(level, msg) {
    if (logHandler && this.enabledFor(level)) {
      logHandler(
        msg,
        Object.assign({ level: level, name: this.name }, this.options)
      );
    }
  }
}

export default Logger;
