// alias 
const doc = document, win = window;
const toString = Object.prototype.toString;
const slice = Object.prototype.slice;
// let 
let rmsPrefix = /^-ms-/, rHyphen = /-(.)/g, rUpper = /([A-Z])/g;

function hasClass(element, className) {
  if (element.classList)
    return !!className && element.classList.contains(className)
  else
    return ` ${element.className.baseVal || element.className} `.indexOf(` ${className} `) !== -1
}

function addClass(element, className) {
  if (element.classList) {
    element.classList.add(className);
  } else if (!hasClass(element, className)) {
    if (typeof element.className === 'string') {
      element.className += ' ' + className;
    } else {
      element.setAttribute('class', (element.className && element.className.baseVal || '') + ' ' + className);
    }
  }
}

function replaceClassName(origClass, classToRemove) {
  return origClass.replace(new RegExp('(^|\\s)' + classToRemove + '(?:\\s|$)', 'g'), '$1').replace(/\s+/g, ' ').replace(/^\s*|\s*$/g, '');
}

function removeClass(element, className) {
  if (element.classList)
    element.classList.remove(className)
  else if (typeof element.className === 'string')
    element.className = replaceClassName(element.className, className)
  else
    element.setAttribute('class', replaceClassName(element.className && element.className.baseVal || '', className))
}

function toggleClass(element, className) {
  hasClass(element, className) ? removeClass(element, className) : addClass(element, className);
}

function camelize(string) {
  return string.replace(rHyphen, (_, chr) => chr.toUpperCase())
}

// https://github.com/facebook/react/blob/2aeb8a2a6beb00617a4217f7f8284924fa2ad819/src/vendor/core/camelizeStyleName.js
function camelizeStyleName(string) {
  return camelize(string.replace(rmsPrefix, 'ms-'));
}

function hyphenate(string) {
  return string.replace(rUpper, '-$1').toLowerCase();
}

// https://github.com/facebook/react/blob/2aeb8a2a6beb00617a4217f7f8284924fa2ad819/src/vendor/core/hyphenateStyleName.js
function hyphenateStyleName(string) {
  return hyphenate(string).replace(rmsPrefix, '-ms-');
}

let rposition = /^(top|right|bottom|left)$/;
let rnumnonpx = /^([+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|))(?!px)[a-z%]+$/i;
function _getComputedStyle(node) {
  if (!node) throw new TypeError('No Element passed to `getComputedStyle()`')
  var doc = node.ownerDocument;

  return 'defaultView' in doc
    ? doc.defaultView.opener
      ? node.ownerDocument.defaultView.getComputedStyle(node, null)
      : window.getComputedStyle(node, null)
    : { //ie 8 "magic" from: https://github.com/jquery/jquery/blob/1.11-stable/src/css/curCSS.js#L72
      getPropertyValue(prop) {
        var style = node.style;

        prop = camelize(prop)

        if (prop == 'float') prop = 'styleFloat';

        let current = node.currentStyle[prop] || null;

        if (current == null && style && style[prop])
          current = style[prop];

        if (rnumnonpx.test(current) && !rposition.test(prop)) {
          // Remember the original values
          let left = style.left;
          let runStyle = node.runtimeStyle;
          let rsLeft = runStyle && runStyle.left;

          // Put in the new values to get a computed value out
          if (rsLeft)
            runStyle.left = node.currentStyle.left;

          style.left = prop === 'fontSize' ? '1em' : current;
          current = style.pixelLeft + 'px';

          // Revert the changed values
          style.left = left;
          if (rsLeft) runStyle.left = rsLeft;
        }

        return current;
      }
    }
}
/**
 * 
 * 
 * @class Dom
 */
class Dom {
  constructor(selector) {
    return this._query.call(this, selector);
  }

  _query(selector, ctx) {
    let = nodeList = [], i;

    if (!selector) {
      return this;
    } else if (toString.call(selector).toLowerCase() === '[object nodelist]') {
      nodeList = selector;
    } else if (selector.nodeType) {
      nodeList.push(selector);
    } else if (ctx) {
      for (i = 0; i < this.length; i++) {
        nodeList = nodeList.concat(Array.from(this[i].querySelectorAll(selector)));
      }
    } else if (selector.__$__ && 'length' in selector) {
      nodeList = slice.call(selector);
    } else {
      nodeList = doc.querySelectorAll(selector);
    }

    ctx = ctx || this;
    for (i = 0; i < nodeList.length; i++) {
      ctx[i] = nodeList[i]
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
    this._query(selector, new Dom);
  }

  /* ---------------attributes ---------------------*/
  addClass(className) {
    return this._each((index, element) => {
      addClass(element, className);
    })
  }

  removeClass(className) {
    return this._each((index, element) => {
      removeClass(element, className);
    })
  }
  toggleClass(className) {
    return this._each((index, element) => {
      toggleClass(element, className);
    })
  }

  hasClass(className) {
    return hasClass(this[0], className);
  }

  css(attrName, value) {
    if (typeof attrName === 'object') {
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
      value = _getComputedStyle(this[0])[camelizeName];
    }
  }
  // display element
  show() {
    return this.css('display', '');
  }

  hide() {
    return this.css('display', 'none');
  }
  // get set attributes
  attr(attrName, value) {
    if(value){
      return this._each((index, element)=>{
        element.setAttribute(attrName, value);
      })
    }

    if(this.length > 0 ){
      value = this[0].getAttribute(attrName);
    }

    return value;
  }

  removeAttr(attrName){
    this._each((index, element)=>{
      element.removeAttribute(attrName);
    });
  }

  /* ---------------traverse ---------------------*/
  children(){
    
  }

}