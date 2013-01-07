var domInspector = null;

var rietveldInstances = [
  "codereview.appspot.com",
  "chromiumcodereview.appspot.com",
  "chromereviews.googleplex.com",
  "codereview.chromium.org"
];

function RietveldInspector() {
  this.isDiff = function() {
    return Boolean(document.URL.match(/.*\/diff2?\//));
  };
  this.isPatch = function() {
    return $('.issue-details').length > 0;
  };
  this.codelineAll = function() {  return '\
      .olddark, .newdark, .oldreplace, .olddelete, .oldinsert, .oldequal, .oldblank, \
      .oldlight, .newlight, .oldreplace1, .newreplace1, \
      .newreplace, .newdelete, .newinsert, .newequal, .newblank, \
      .oldmove, .oldchangemove, .oldchangemove1, .oldmove_out, .oldchangemove_out, \
      .newmove, .newchangemove, .newchangemove1, \
      .udiffadd, .udiffremove, .udiff, .debug-info';
  };
  this.codelineLight = function() { return '.oldlight, .newlight'; };
  this.codelineDark = function() { return '.olddark, .newdark'; };
  this.codelineOldReplace = function() { return '.oldreplace, .oldreplace1'; };
  this.codelineNewReplace = function() { return '.newreplace, .newreplace1'; };
  this.codelineOldDelete = function() { return '.olddelete'; };
  this.codelineNewInsert = function() { return '.newinsert'; };
  this.adjustUrlForColumnWidth = function(src, widthMap) {
    var filetype = src.substr(src.lastIndexOf('.') + 1);
    if (filetype in widthMap)
      src += '?column_width=' + widthMap[filetype];
    return src;
  };
  this.adjustDiffFrameForInline = function(frame) {
    frame.find('html').css('margin', 'auto');

    var code = frame.find('.code');
    code.children().css('margin', '3px');
    code.parents().andSelf()
      .css('margin', '0')
      .css('display', 'table')
      .siblings()
        .hide();
    code.find('.codenav').hide();
    code.find('#table-top').css('position', '');
    code.find('#codeTop').hide();
    code.find('#codeBottom').hide();
  };
  this.findPatchTables = function() { return $('.issue-list table'); };
  this.findDiffLinks = function() { return $('.issue-list a[href*="/diff"]'); };
  this.findUnifiedLinks = function() { return $('.issue-list a[href*="/patch/"]'); };
  this.unifiedLinkRewriter = function() {
    return function() {
      var href = this.href;
      var diffHref = href.substr(0, href.lastIndexOf('/') + 1).replace('patch', 'diff') + this.innerHTML.trim();
      var rowId = $(this).data().rowId;
      var frameId = rowId + frameIdSuffixFromDiffHref(diffHref);
      $(this).data({ patch: href, diff: diffHref, frameId: frameId });
    };
  };
  this.findPatchContainers = function() { return $('div[id^=ps-]'); };
  this.modifyPatchPage = function() {
    // The baseurl is often long and makes the whole left pane too long... hide it.
    function hideBaseUrl() {
      chrome.storage.sync.get('hideBaseUrl', function(items) {
        if (items['hideBaseUrl']) {
          $('.issue_details_sidebar').children().eq(4).hide();
          $('.meta').attr('width', '10%');
        } else {
          if ($('.meta').attr('width')[0] == '10%') {
            $('.meta').attr('width', '20%');
          }
          $('.issue_details_sidebar').children().eq(4).show();
        }
      });
    }
    hideBaseUrl();
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      hideBaseUrl();
    }, 'hideBaseUrl');
  };
}


function isUrlRietveld(url) {
  for (var i in rietveldInstances) {
    if (url.search(rietveldInstances[i])) return true;
  }
}

if (isUrlRietveld(document.URL)) {
  domInspector = new RietveldInspector();
} else if (false) {

}




