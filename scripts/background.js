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
    if (change.url != null) {
      chrome.storage.sync.get("hosts", function(items) {
        var validHosts = items["hosts"].split(",");

        var isValid = validHosts.reduce(function(isMatch, host) {
          return isMatch || change.url.indexOf(host) > 0;
        }, false);

        if (isValid) {
          // inject necessary scripts
          chrome.tabs.executeScript(tabId, {file: "lib/jquery-1.8.3.min.js"}, function() {
            chrome.tabs.executeScript(tabId, {file: "scripts/lib.js"}, function() {
              chrome.tabs.executeScript(tabId, {file: "scripts/identify.js"}, function() {
               chrome.tabs.executeScript(tabId, {file: "scripts/main.js"});
              });
            });
          });
        }
      });
    }
  });
