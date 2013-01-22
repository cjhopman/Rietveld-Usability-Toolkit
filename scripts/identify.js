var domInspector = null;

var rietveldInstances = [
  "codereview.appspot.com",
  "chromiumcodereview.appspot.com",
  "chromereviews.googleplex.com",
  "codereview.chromium.org"
];

var gerritInstances = [
  "gerrit.chromium.org",
  "gerrit-int.chromium.org"
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
  this.codelineOld = function() { return '\
      .oldreplace, .olddelete, .oldinsert, .oldequal, .oldblank, .oldreplace1, \
      .oldmove, .oldchangemove, .oldchangemove1, .oldmove_out, .oldchangemove_out, \
      .rb-null';
  };
  this.codelineNew = function() {  return '\
      .newreplace1, .newreplace, .newdelete, .newinsert, .newequal, .newblank, \
      .newmove, .newchangemove, .newchangemove1, \
      .rb-null';
  };
  this.codelineLight = function() { return '.oldlight, .newlight'; };
  this.codelineDark = function() { return '.olddark, .newdark'; };
  this.codelineOldReplace = function() { return '.oldreplace, .oldreplace1'; };
  this.codelineNewReplace = function() { return '.newreplace, .newreplace1'; };
  this.codelineOldDelete = function() { return '.olddelete'; };
  this.codelineNewInsert = function() { return '.newinsert'; };
  this.getCodelineInnerChrome = function() {
    return $('tr[id^="skip-"]').add('.inline-comments');
  };
  this.lineNumberRange = function(html) {
    var m = html.match('( *(<u>)?\[0-9\]*(</u>)? )');
    console.log(html, m)
    return m ? [0, m[0].length] : [0, 0];
  }
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
    var inspector = this;
    return function() {
      var href = this.href;
      var diffHref = href.substr(0, href.lastIndexOf('/') + 1).replace('patch', 'diff') + this.innerHTML.trim();
      var rowId = $(this).data().rowId;
      var frameId = rowId + inspector.frameIdSuffixFromDiffHref(diffHref);
      $(this).data({ patch: href, diff: diffHref, frameId: frameId });
    };
  };
  this.findPatchContainers = function() { return $('div[id^=ps-]'); };
  this.frameIdSuffixFromDiffHref = function(href) {
    return '_frame_' + href.match('/diff2?/([^/]*)/')[1].replace(':', '_');
  }
  this.columnIdFromHtml = function(html) { return html; };
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

// TODO: Fix Gerrit support. Gerrit is built with GWT and does some weird frame
// busting.
function GerritInspector() {
  // TODO: I know the element classes change a lot for different gerrits. These
  // are only the classes for *.chromium.org, but at least they are extracted
  // to one spot.
  var basePattern = 'https?:\/\/[^/]+\/gerrit\/#\/c\/[0-9]+';
  var isPatchPattern = basePattern + '(\/([0-9]*)?)?$';
  var isDiffPattern = basePattern + '\/[0-9]*\/(.+)';
  this.basePattern = basePattern;
  this.isDiffPattern = isDiffPattern;
  var domSelectors = {
    patchTables: '.GFE-PU4BNB',
    patchContainers: '.gwt-DisclosurePanel div.content'
  };
  this.isDiff = function() {
    return Boolean(document.URL.match(isDiffPattern));
  };
  this.isPatch = function() {
    return Boolean(document.URL.match(isPatchPattern));
  };
  // TODO: All this codeline stuff is wrong.
  this.codelineAll = function() {  return ''; };
  this.codelineOld = function() {  return ''; };
  this.codelineNew = function() {  return ''; };
  this.codelineLight = function() {  return ''; };
  this.codelineDark = function() {  return ''; };
  this.codelineOldReplace = function() {  return ''; };
  this.codelineNewReplace = function() {  return ''; };
  this.codelineOldDelete = function() {  return ''; };
  this.codelineNewInsert = function() {  return ''; };
  this.adjustUrlForColumnWidth = function(src, widthMap) { return src; };
  this.adjustDiffFrameForInline = function(frame) {
    return;
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
  this.findPatchTables = function() { return $(domSelectors.patchTables); };
  this.findDiffLinks = function() {
    return $(domSelectors.patchTables + ' a:not([href$="unified"])')
      .filter(function() { return Boolean(this.href.match(isDiffPattern)); });
  };
  this.findUnifiedLinks = function() { return $(); };
  this.unifiedLinkRewriter = function() { return function() { } };
  this.frameIdSuffixFromDiffHref = function(href) {
    var file = href.match(isDiffPattern)[1];
    return '_frame_' + file.replace('/', '_');
  }
  this.columnIdFromHtml = function(html) { return 'View'; };
  this.findPatchContainers = function() { return $(domSelectors.patchContainers); };
  this.modifyPatchPage = function() {
  };
}


function isUrlRietveld(url) {
  for (var i in rietveldInstances) {
    if (url.indexOf(rietveldInstances[i]) >= 0) {
      console.log(url, rietveldInstances[i]);
      return true;
    }
  }
  return false;
}

function isUrlGerrit(url) {
  for (var i in gerritInstances) {
    if (url.indexOf(gerritInstances[i]) >= 0) {
      console.log(url, gerritInstances[i]);
      return true;
    }
  }
  return false;
}

if (isUrlRietveld(document.URL)) {
  domInspector = new RietveldInspector();
} else if (isUrlGerrit(document.URL)) {
  domInspector = new GerritInspector();
}




