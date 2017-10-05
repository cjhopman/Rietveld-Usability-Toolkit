(function() {
    function ScriptExecution(tabId) {
        this.tabId = tabId;
    }

    ScriptExecution.prototype.executeScripts = function(fileArray) {
        fileArray = Array.prototype.slice.call(arguments); // ES6: Array.from(arguments)
        return Promise.all(fileArray.map(file => exeScript(this.tabId, file))).then(() => this); // 'this' will be use at next chain
    };

    ScriptExecution.prototype.executeCodes = function(fileArray) {
        fileArray = Array.prototype.slice.call(arguments);
        return Promise.all(fileArray.map(code => exeCodes(this.tabId, code))).then(() => this);
    };

    ScriptExecution.prototype.injectCss = function(fileArray) {
        fileArray = Array.prototype.slice.call(arguments);
        return Promise.all(fileArray.map(file => exeCss(this.tabId, file))).then(() => this);
    };

    function promiseTo(fn, tabId, info) {
        return new Promise(resolve => {
            fn.call(chrome.tabs, tabId, info, x => resolve());
        });
    }

    function exeScript(tabId, path) {
        let info = { file : path, runAt: 'document_end' };
        return promiseTo(chrome.tabs.executeScript, tabId, info);
    }

    function exeCodes(tabId, code) {
        let info = { code : code, runAt: 'document_end' };
        return promiseTo(chrome.tabs.executeScript, tabId, info);
    }

    function exeCss(tabId, path) {
        let info = { file : path, runAt: 'document_end' };
        return promiseTo(chrome.tabs.insertCSS, tabId, info);
    }

    window.ScriptExecution = ScriptExecution;
})()

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == 'show_page_action') {
      chrome.pageAction.show(sender.tab.id);
      sendResponse({});
    }
    if (request.action == 'load_script') {
      // TODO: This isn't really what we want, we want to load the script into a specific frame...
      var details = {
          file: request.file,
          allFrames: true
        };
      chrome.tabs.executeScript(sender.tab.id, details, function() {
          sendResponse();
        });
      return true;
    }
  });

chrome.tabs.onUpdated.addListener(
  function(tabId, change, tab) {
    if (tab.url != null && change.status == "complete") {
      chrome.storage.sync.get("hosts", function(items) {
        var validHosts = items["hosts"].split(",");

        var isValid = validHosts.reduce(function(isMatch, host) {
          return isMatch || tab.url.indexOf(host) > 0;
        }, false);

        if (isValid) {
          // patch page, needs these scripts for diff too
          if (tab.url.match(/.*\/\d+\//)) {
            console.log("RUT DEBUG: patch page");
            new ScriptExecution(tabId)
              .executeScripts("lib/jquery-1.8.3.min.js","scripts/lib.js","scripts/settings.js","scripts/identify.js",
                "scripts/storage.js","scripts/loadQueue.js","scripts/main.js","scripts/controls.js","scripts/help.js")
              .then(s => s.injectCss("css/main.css","css/spinner.css"));
          }
          // diff page, inject diff scripts
          if (tab.url.match(/.*\/diff2?\//)) {
            console.log("RUT DEBUG: diff page");
            new ScriptExecution(tabId)
              .executeScripts("scripts/diff_begin.js","lib/syntax/scripts/shCore.js","scripts/diff_idle.js",
                "scripts/brush.js","scripts/syntax.js","scripts/codesearch.js")
              .then(s => s.injectCss("css/style.css"));
          }
        }
      });
    }
  });
