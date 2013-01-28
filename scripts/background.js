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
