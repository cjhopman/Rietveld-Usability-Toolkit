chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == 'show_page_action') {
      chrome.pageAction.show(sender.tab.id);
      sendResponse({});
    }
    if (request.action == 'load_script') {
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
