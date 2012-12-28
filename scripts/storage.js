// Decorate the chrome.storage API to validate settings usage against the
// manifest, and add some functionality.

function decorateChromeApis() {
  var keys = Object.keys(settings.settings);
  function validateKeys(obj) {
    if (!$.isArray(obj) && !$.isPlainObject(obj)) {
      obj = [obj];
    }
    $.each(obj, function(k) {
      k = $.isNumeric(k) ? obj[k] : k;
      if (keys.indexOf(k) < 0) {
        var keysString = "Available keys: <";
        $.each(keys, function(k) { keysString += " " + keys[k]; });
        keysString += " >";
        throw new Error(k + " not a valid key. " + keysString);
      }
    });
    return obj;
  }

  (function(chromeEvent) {
    var fn = chromeEvent.addListener;
    chromeEvent.addListener = function(callback, filter) {
      if (filter) filter = validateKeys(filter);
      else filter = keys;
      return fn.call(chromeEvent, function(items) {
        var filtered_items = {};
        $.each(items, function(i) {
          if (keys.indexOf(i) > 0 && filter.indexOf(i) > 0)
            filtered_items[i] = keys[i];
        });
        if (filtered_items) {
          callback(filtered_items);
        }
      });
    };
  })(chrome.storage.onChanged);

  function decorateGet(storageArea) {
    var fn = storageArea.get;
    storageArea.get = function(keys, callback) {
      keys = validateKeys(keys);
      var keysWithDefaults = {};
      $.each(keys, function(k) {
        k = $.isNumeric(k) ? keys[k] : k;
        return keysWithDefaults[k] = settings.settings[k].default;
      });
      return fn.call(storageArea, keysWithDefaults, callback);
    };
  };
  decorateGet(chrome.storage.local);
  decorateGet(chrome.storage.sync);

  function decorateSet(storageArea) {
    var fn = storageArea.set;
    storageArea.set = function(items, cb) {
      items = validateKeys(items);
      return fn.call(items, cb);
    }
  }
  decorateSet(chrome.storage.local);
  decorateSet(chrome.storage.sync);
};
decorateChromeApis();
