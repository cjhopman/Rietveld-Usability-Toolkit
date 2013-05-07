// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

Array.prototype.lowerBound = function(v, cmp) {
  cmp = cmp || function(l, r) { return l - r; };
  var lo = 0, hi = this.length;
  while (lo != hi) {
    var mid = Math.floor((lo + hi) / 2);
    var x = cmp(this[mid], v);
    if (x < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo == this.length ? -1 : lo;
}

function injectScript(document, func) {
  var script = document.createElement('script');
  script.textContent = '(' + func + ')(' + JSON.stringify(Array.prototype.slice.call(arguments, 2)) + ')';
  (document.head || document.documentElement).appendChild(script);
  script.parentNode.removeChild(script);
}
function injectScriptFile(document, file) {
  var script = document.createElement('script');
  script.src = file;
  (document.head || document.documentElement).appendChild(script);
  script.parentNode.removeChild(script);
}

var logDepth = 0;
function logWrapper(name, pre, post) {
  return function (func) {
    var args = [].slice.call(arguments, 1);
    pre(args);
    logDepth++;
    var ret = func.apply(this, args);
    logDepth--;
    post(ret);
    return ret;
  };
}

function decorate(name, func) {
  var base = window;
  var path = name.split('.');
  for (var i = 0; i < path.length - 1; i++)
    base = base[path[i]];
  path = path[path.length - 1];

  base[path] = (function(old) { return function () {
        return func.apply(this, [old].concat([].slice.apply(arguments)));
      };
    })(base[path]);
}

function decorateRecursive(name, func) {
  window[name] = (function(old) { return function () {
        var self = window[name];
        // TODO: make this safer
        window[name] = old;
        var ret = func.apply(this, [old].concat([].slice.apply(arguments)));
        window[name] = self;
        return ret;
      };
    })(window[name]);
}

function loggingDecorator(name) {
  decorate(name, logWrapper(name, 
        function(args) {
          console.log(Array(logDepth + 1).join('_'), name, args);
        },
        function(ret) {
          console.log(Array(logDepth + 1).join('_'), name, ret);
        }));
}

function timingDecorator(name) {
  var start;
  decorate(name, logWrapper(name, 
        function() {
          start = performance.now();
          var args = [].slice.call(arguments, 1);
          console.log(Array(logDepth + 1).join('_'), name, 'start: ' + start);
        },
        function(ret) {
          end = performance.now();
          console.log(Array(logDepth + 1).join('_'), name, 'end: ' + end, 'elapsed: ' + (end - start));
        }));
}

function sendCustomEvent(name, details, doc) {
  doc = doc || document;
  var ev = doc.createEvent('CustomEvent');
  ev.initCustomEvent(name, false, false, details);
  doc.dispatchEvent(ev);
}

if (chrome.extension) {
  injectScriptFile(document, chrome.extension.getURL('scripts/lib.js'));
}

