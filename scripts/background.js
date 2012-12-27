chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender);
    console.log(sendResponse);
    chrome.pageAction.show(sender.tab.id);
    sendResponse({});
  });
