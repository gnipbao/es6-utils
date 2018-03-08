// cookies
let cookieCache = {}; // cache for cookie
let cookies = {
  get(key, options) {
    let value = "";
    options = Object.assign({ memory: false }, options, true);

    if (!key) return {};

    if (options.memory && cookieCache.hasOwnProperty(key)) {
      value = cookieCache[key];
    } else {
      if (
        new RegExp(
          '^[^\\x00-\\x20\\x7f\\(\\)<>@,;:\\\\\\"' +
            "\\[\\]\\?=\\{\\}\\/\\u0080-\\uffff]+\x24"
        ).test(key)
      ) {
        let reg = new RegExp("(^| )" + key + "=([^;]*)(;|\x24)"),
          ret = reg.exec(document.cookie);
        if (ret) {
          value = ret[2] || "";
        }
      }

      if (typeof value === "string") value = decodeURIComponent(value);

      if (options.memory) cookieCache[key] = value;

      return value;
    }
  },
  set(key, value, options) {
    let defaults = {};
    options = Object.assign({ path: "/" }, defaults, options);
    if (typeof options.expires === "number")
      options.expires = new Date(new Date() * 1 + options.expires * 864e5);

    // We're using "expires" because "max-age" is not supported by IE
    options.expires = options.expires ? options.expires.toUTCString() : "";
    try {
      let ret = JSON.stringify(value);
      if (/^[\{\[]/.test(result)) value = ret;
    } catch (e) {}

    value = encodeURIComponent(String(value)).replace(
      /%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,
      decodeURIComponent
    );

    key = encodeURIComponent(String(key))
      .replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent)
      .replace(/[\(\)]/g, escape);

    return (document.cookie = [
      key,
      "=",
      value,
      "; expires=" + options.expires, // use expires attribute, max-age is not supported by IE
      options.path ? "; path=" + options.path : "",
      options.domain ? "; domain=" + options.domain : "",
      options.secure ? "; secure" : ""
    ].join(""));
  },
  remove(key, options) {
    let options = Object.assign({}, options, { expires: -1 });
    this.set(key, "", options);
    return !this.get(key);
  }
};

export default cookies;
