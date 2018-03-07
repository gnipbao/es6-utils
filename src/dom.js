// alias
const doc = document,
  win = window;
const toString = Object.prototype.toString;
const slice = Object.prototype.slice;
// let
let rmsPrefix = /^-ms-/,
  rHyphen = /-(.)/g,
  rUpper = /([A-Z])/g;

let canUseDom = () =>
  !!(typeof win !== "undefined" && win.document && win.document.createElement);

function hasClass(element, className) {
  if (element.classList)
    return !!className && element.classList.contains(className);
  else
    return (
      ` ${element.className.baseVal || element.className} `.indexOf(
        ` ${className} `
      ) !== -1
    );
}

function addClass(element, className) {
  if (element.classList) {
    element.classList.add(className);
  } else if (!hasClass(element, className)) {
    if (typeof element.className === "string") {
      element.className += " " + className;
    } else {
      element.setAttribute(
        "class",
        ((element.className && element.className.baseVal) || "") +
          " " +
          className
      );
    }
  }
}

function replaceClassName(origClass, classToRemove) {
  return origClass
    .replace(new RegExp("(^|\\s)" + classToRemove + "(?:\\s|$)", "g"), "$1")
    .replace(/\s+/g, " ")
    .replace(/^\s*|\s*$/g, "");
}

function removeClass(element, className) {
  if (element.classList) element.classList.remove(className);
  else if (typeof element.className === "string")
    element.className = replaceClassName(element.className, className);
  else
    element.setAttribute(
      "class",
      replaceClassName(
        (element.className && element.className.baseVal) || "",
        className
      )
    );
}

function toggleClass(element, className) {
  hasClass(element, className)
    ? removeClass(element, className)
    : addClass(element, className);
}

function camelize(string) {
  return string.replace(rHyphen, (_, chr) => chr.toUpperCase());
}

// https://github.com/facebook/react/blob/2aeb8a2a6beb00617a4217f7f8284924fa2ad819/src/vendor/core/camelizeStyleName.js
function camelizeStyleName(string) {
  return camelize(string.replace(rmsPrefix, "ms-"));
}

function hyphenate(string) {
  return string.replace(rUpper, "-$1").toLowerCase();
}

// https://github.com/facebook/react/blob/2aeb8a2a6beb00617a4217f7f8284924fa2ad819/src/vendor/core/hyphenateStyleName.js
function hyphenateStyleName(string) {
  return hyphenate(string).replace(rmsPrefix, "-ms-");
}

let rposition = /^(top|right|bottom|left)$/;
let rnumnonpx = /^([+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|))(?!px)[a-z%]+$/i;
function _getComputedStyle(node) {
  if (!node) throw new TypeError("No Element passed to `getComputedStyle()`");
  let doc = node.ownerDocument;

  return "defaultView" in doc
    ? doc.defaultView.opener
      ? node.ownerDocument.defaultView.getComputedStyle(node, null)
      : window.getComputedStyle(node, null)
    : {
        //ie 8 "magic" from: https://github.com/jquery/jquery/blob/1.11-stable/src/css/curCSS.js#L72
        getPropertyValue(prop) {
          let style = node.style;

          prop = camelize(prop);

          if (prop == "float") prop = "styleFloat";

          let current = node.currentStyle[prop] || null;

          if (current == null && style && style[prop]) current = style[prop];

          if (rnumnonpx.test(current) && !rposition.test(prop)) {
            // Remember the original values
            let left = style.left;
            let runStyle = node.runtimeStyle;
            let rsLeft = runStyle && runStyle.left;

            // Put in the new values to get a computed value out
            if (rsLeft) runStyle.left = node.currentStyle.left;

            style.left = prop === "fontSize" ? "1em" : current;
            current = style.pixelLeft + "px";

            // Revert the changed values
            style.left = left;
            if (rsLeft) runStyle.left = rsLeft;
          }

          return current;
        }
      };
}

function siblings(n, elem) {
  let matched = [];

  for (; n; n = n.nextSibling) {
    if (n.nodeType === 1 && n !== elem) {
      matched.push(n);
    }
  }

  return matched;
}

function sibling(cur, dir) {
  while ((cur = cur[dir]) && cur.nodeType !== 1) {}
  return cur;
}

function fallback(context, node) {
  if (node)
    do {
      if (node === context) return true;
    } while ((node = node.parentNode));

  return false;
}

let toPxVal = val => (!isNaN(val) ? val + "px" : "0px");

let _on = (function() {
  if (document.addEventListener) {
    return (node, type, handler, capture) =>
      node.addEventListener(type, handler, capture || false);
  } else if (document.attachEvent) {
    return (node, type, handler) =>
      node.attachEvent("on" + type, e => {
        e = e || window.event;
        e.target = e.target || e.srcElement;
        e.currentTarget = node;
        handler.call(node, e);
      });
  }
})();

let _off = (function() {
  if (document.addEventListener) {
    return (node, type, handler, capture) =>
      node.removeEventListener(type, handler, capture || false);
  } else if (document.attachEvent) {
    return (node, type, handler) => node.detachEvent("on" + eventName, handler);
  }
})();

let _once = (node, type, handler, capture) => {
  _on(node, type, handler, capture);
  return () => _off(node, type, handler, capture);
};

/**
 *
 *
 * @class Dom
 */
class Dom {
  constructor(selector) {
    this.elem = this[0];
    return this._query.call(this, selector);
  }

  _query(selector, ctx) {
    let nodeList = [],
      i;

    if (!selector) {
      return this;
    } else if (toString.call(selector).toLowerCase() === "[object nodelist]") {
      nodeList = selector;
    } else if (selector.nodeType) {
      nodeList.push(selector);
    } else if (ctx) {
      for (i = 0; i < this.length; i++) {
        nodeList = nodeList.concat(
          Array.from(this[i].querySelectorAll(selector))
        );
      }
    } else if (selector.__$__ && "length" in selector) {
      nodeList = slice.call(selector);
    } else {
      nodeList = doc.querySelectorAll(selector);
    }

    ctx = ctx || this;
    for (i = 0; i < nodeList.length; i++) {
      ctx[i] = nodeList[i];
    }
    ctx.__$__ = true;
    ctx.length = nodeList.length;
    return ctx;
  }

  _each(fn) {
    for (let i = 0; i < this.length; i++) {
      if (fn.call(this[i], i, this[i]) === false) break;
    }
    return this;
  }

  find(selector) {
    this._query(selector, new Dom());
  }

  /* ---------------attributes ---------------------*/
  addClass(className) {
    return this._each((index, element) => {
      addClass(element, className);
    });
  }

  removeClass(className) {
    return this._each((index, element) => {
      removeClass(element, className);
    });
  }

  toggleClass(className) {
    return this._each((index, element) => {
      toggleClass(element, className);
    });
  }

  hasClass(className) {
    return hasClass(this.elem, className);
  }

  css(attrName, value) {
    if (typeof attrName === "object") {
      for (key in attrName) {
        this.css(key, attrName[key]);
      }
      return;
    }
    let camelizeName = camelizeStyleName(attrName);

    if (value) {
      return this._each((index, element) => {
        element.style[camelizeName] = value;
      });
    }
    if (this.length > 0) {
      value = _getComputedStyle(this.elem)[camelizeName];
    }
  }
  // display element
  show() {
    return this.css("display", "");
  }

  hide() {
    return this.css("display", "none");
  }
  // get set attributes
  attr(attrName, value) {
    if (value) {
      return this._each((index, element) => {
        element.setAttribute(attrName, value);
      });
    }

    if (this.length > 0) {
      value = this.elem.getAttribute(attrName);
    }

    return value;
  }

  removeAttr(attrName) {
    this._each((index, element) => {
      element.removeAttribute(attrName);
    });
  }

  /* ---------------traverse ---------------------*/
  children() {
    let target = this.elem;
    return siblings(target.firstChild);
  }

  siblings(elem) {
    let target = this[0];
    return siblings((target.parentNode || {}).firstChild, elem);
  }

  next() {
    return sibling(this.elem, "nextSibling");
  }

  prev() {
    return sibling(this.elem, "previousSibling");
  }

  /*--------------- manipulations -------------------- */
  html(val) {
    if (typeof val === "string") {
      this._each((index, elem) => {
        elem.innerHTML = val;
      });
    } else if (this.elem) {
      return this.elem.innerHTML;
    }
  }

  append(elem) {
    if (!this.elem) return this;
    let fragment, tempElem;
    if (typeof elem === "string") {
      fragment = doc.createDocumentFragment();
      tempElem = doc.createElement("div");
      fragment.appendChild(tempElem);
      elem = tempElem.firstChild;
    }
    if (
      this.elem.nodeType === 1 ||
      this.elem.nodeType === 11 ||
      this.elem.nodeType === 9
    ) {
      this.elem.appendChild(elem);
    }
    tempElem = null;

    return this;
  }

  remove() {
    return this._each((index, elem) => {
      if (elem.parentNode) elem.parentNode.removeChild(elem);
    });
  }

  contains(node) {
    let context = this.elem;
    return canUseDom
      ? node => {
          if (context.contains) {
            return context.contains(node);
          } else if (context.compareDocumentPosition) {
            return (
              context === node || !!(context.compareDocumentPosition(node) & 16)
            );
          } else {
            return fallback(context, node);
          }
        }
      : fallback(context, node);
  }

  offset() {
    let doc = (this.elem && this.elem.ownerDocument) || document;
    let docElem = doc && doc.document;
    let box = {
      top: 0,
      left: 0,
      height: 0,
      width: 0
    };

    if (!doc) return;

    if (this.elem.getBoundingClientRect !== undefined)
      box = this.elem.getBoundingClientRect();

    // IE8 getBoundingClientRect doesn't support width & height
    box = {
      top:
        box.top +
        (win.pageYOffset || docElem.scrollTop) -
        (docElem.clientTop || 0),
      left:
        box.left +
        (win.pageXOffset || docElem.scrollLeft) -
        (docElem.clientLeft || 0),
      width: (box.width == null ? this.elem.offsetWidth : box.width) || 0,
      height: (box.height == null ? this.elem.offsetHeight : box.height) || 0
    };

    return box;
  }
  // width height both from computed style first then from offset
  width(value) {
    if (!this.elem) return 0;
    if (value) {
      return this.css("width", toPxVal(value));
    } else {
      let styledWidth = this.css("width");
      let width = parseInt(styledWidth === "100%" ? 0 : styledWidth);

      if (isNaN(width)) {
        width = this.offset().width;
      }

      return width;
    }
  }

  height(value) {
    if (this.elem) return 0;
    if (value) {
      return this.css("height", toPxVal(value));
    } else {
      let styledHeight = this.css("height");
      let height = parseInt(styledHeight === "100%" ? 0 : styledHeight);

      if (isNaN(height)) {
        height = this.offset().height;
      }
      return height;
    }
  }

  /* -------------------- events ------------------*/
  on(type, cb) {
    let evts = (this._events = this._events || []);
    let cbs = evts[type];
    if (!cbs) cbs = evts[type] = [];
    cbs.push(cb);
    return this._each((index, elem) => {
      _on(elem, type, cb, false);
    });
  }

  off(type, cb) {
    let evts = (this._events = this._events || []);
    let cbs = evts[type];
    if (!cbs) cbs = evts[type] = [];
    return this._each((index, elem) => {
      _off(elem, type, cb, false);
    });
  }
  // alias once
  listen(type, cb) {
    let evts = (this._events = this._events || []);
    let cbs = evts[type];
    if (!cbs) cbs = evts[type] = [];
    return this._each((index, elem) => {
      _once(elem, type, cb, false);
    });
  }
  // analog user event and use data
  fire(type, evt) {
    let evts = (this._events = this._events || []);
    let cbs = evts[type];
    if (!cbs) cbs = evts[type] = [];
    evt.data = evt.data || {};
    this._each((index, elem) => {
      cbs.forEach(cb => cb.call(elem, evt));
    });
  }
}

export default function(selector) {
  return new Dom(selector);
}
