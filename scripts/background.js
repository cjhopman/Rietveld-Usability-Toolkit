chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == 'show_page_action') {
      chrome.pageAction.show(sender.tab.id);
      sendResponse({});
    }
  });
