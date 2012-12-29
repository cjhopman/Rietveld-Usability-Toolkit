chrome.extension.sendMessage({}, function(response) {});

function useInconsolata() {
  return true;
}

var codelineSelector = '\
    .olddark, .newdark, .oldreplace, .olddelete, .oldinsert, .oldequal, .oldblank, \
    .oldlight, .newlight, .oldreplace1, .newreplace1, \
    .newreplace, .newdelete, .newinsert, .newequal, .newblank, \
    .oldmove, .oldchangemove, .oldchangemove1, .oldmove_out, .oldchangemove_out, \
    .newmove, .newchangemove, .newchangemove1, \
    .udiffadd, .udiffremove, .udiff, .debug-info';


var currentId = 0;

function getDiffRow(el) {
  var fromRow = el.closest('tr');
  var rowId = fromRow.data().rowId;
  var newRow = $("#" + rowId);
  if (newRow.length) return newRow;

  newRow = $('<tr id="' + rowId + '"></tr>');
  newRow.addClass('rb-frameRow');
  newRow.data({ showingFrameId: null });
  var newCell = $('<td colspan=1000></td>');
  var div = $('<div style="margin:0 auto; width:100%; height:100%; text-align:center"/>');
  fromRow.after(newRow);
  return newRow.append(newCell.append(div));
}

function getDiffFrame(el) {
  var newRow = getDiffRow(el);
  var rowId = newRow.data().rowId;
  var frameId = el.data().frameId;
  var frame = $("#" + frameId);
  if (frame.length) return frame;

  var newFrame = $('<iframe id="' + frameId + '" src="javascript:false" style="width:100%; display: none" frameBorder="0"/>');
  newFrame.addClass('rb-inlineDiff');
  newRow.find('div').append(newFrame);
  return newFrame;
}

function hideFrame(row) {
  var currFrame = $('#' + row.data().showingFrameId);
  if (currFrame.length < 1) {
    throw new Error('No current frame found?!?!');
  }
  // TODO: animate
  row.hide();
  currFrame.hide();
  row.data({ showingFrameId: null });
}

function showFrame(row, frame) {
  var currFrameId = row.data().showingFrameId;
  if (currFrameId) {
    swapFrame(row, frame);
    return;
  }

  // TODO: animate
  row.show();
  frame.show();
  row.data({ showingFrameId: frame.attr('id') });
}

function swapFrame(row, frame) {
  var currFrame = $('#' + row.data().showingFrameId);
  if (currFrame.length < 1) {
    throw new Error('No current frame found?!?!');
  }
  currFrame.hide();
  frame.show();
  row.data({ showingFrameId: frame.attr('id') });
}

function toggleFrame(frame) {
  var row = frame.closest('tr');
  var frameId = frame.attr('id');
  var currFrameId = row.data().showingFrameId;
  if (currFrameId == frameId) {
    hideFrame(row);
    row.hide();
  } else {
    if (currFrameId) {
      swapFrame(row, frame);
    } else {
      showFrame(row, frame);
    }
  }
  updateLinksForRow(row);
}

// Update the links in the previous row so that when an inline diff is shown,
// the proper link is highlighted.
function updateLinksForRow(row) {
  var links = row.prev().find('.rb-difflink');
  links.each(function() {
    var anchor = $(this);
    var frameId = anchor.data().frameId;
    var isShowing = row.data().showingFrameId == frameId;
    anchor.toggleClass('rb-showingDiff', isShowing);
  });
}

// A simple throttling mechanism for frame loads.
var loadQueue = [];
var loading = false;
function pumpLoadQueue() {
  if (!loading && loadQueue.length > 0) {
    loadQueue.shift()(
        function() { loading = true; },
        function() { loading = false; pumpLoadQueue(); });
  }
}
function queueFrameLoad(frame, src) {
  loadQueue.push(function(enter, exit) {
    enter();
    frame.attr('src', src);
    frame.load(function() {
      console.log(frame.attr('id'));
      iframeLoaded(frame.attr('id'));
      exit();
    });
  });
  pumpLoadQueue();
}

function createInlineDiff(el) {
  var frame = getDiffFrame(el);
  var currentSrc = frame.attr('src');
  var newSrc = el.data().diff;
  chrome.storage.sync.get(['autoSetColumnWidth', 'columnWidthMap'], function(items) {
    if (items['autoSetColumnWidth']) {
      var filetype = newSrc.substr(newSrc.lastIndexOf('.') + 1);
      if (filetype in items['columnWidthMap'])
        newSrc += '?column_width=' + items['columnWidthMap'][filetype];
    }
    if (currentSrc == newSrc) {
      toggleFrame(frame);
      return;
    }
    var row = frame.closest('tr');
    if (row.data().showingFrameId) {
      hideFrame(row);
    }
    row.show();
    queueFrameLoad(frame, newSrc);
  });
}

function removeDiffChrome(page) {
  var code = page.find(".code");
  code.parents().andSelf().css('margin', '0').css('display', 'table').siblings().hide();
  code.find(".codenav").hide();
}

function iframeLoaded(id) {
  return function() {
    var frame = $("#" + id);
    var inner = frame.contents();

    var resizer = function() {
      var newHeight = inner.outerHeight(true);
      var newWidth = inner.outerWidth(true);
      if (frame.css('height') != newHeight || frame.css('width') != newWidth) {
        // FIXME: This is a total hack. When the page in the iframe gets
        // smaller, its document still fills the iframe, and so newHeight/Width
        // above are larger than we want. If we first make the frame small (not
        // too small, because that causes the outer page to scroll), the
        // document will then shrink to the size of its interior. There should
        // be a better way to do this.
        newHeight = inner.find('html').height();
        newWidth = inner.find('html').width();
        frame.css('height', newHeight).css('width', newWidth);
        newHeight = inner.outerHeight(true);
        newWidth = inner.outerWidth(true);
        frame.css('height', newHeight).css('width', newWidth);
      }
    };

    // FIXME: more hacks. Without this, the new frame flashes at the left edge
    // of the row before moving to the center.
    frame.css('height', '0px').css('width', '0px');
    removeDiffChrome(inner);

    // The observer must be installed before the first resizer() call (otherwise
    // we may miss a modification between the resizer() call an observer
    // installation).
    var observer = new WebKitMutationObserver(resizer);
    observer.observe(inner[0], { attributes: true, subtree: true } );
    resizer();
    toggleFrame(frame);
  }
}

function modifyDiffLinks() {
  chrome.storage.sync.get(['rewriteUnifiedLinks', 'enableInlineDiffs'], function(items) {
    var shouldRewrite = items['rewriteUnifiedLinks'];
    var enableInline = items['enableInlineDiffs'];

    if (!enableInline) {
      // Hide all currently showing inline diffs.
      $('.rb-inlineDiff').hide();
      $('.rb-frameRow').hide().data({'showingFrameId': null});
      $('.rb-showingDiff').removeClass('rb-showingDiff');
    }

    $('.rb-difflink').off('click');

    $('.rb-filename')
      .toggleClass('rb-difflink', shouldRewrite)
      .each(function() {
        this.href = $(this).data(shouldRewrite ? 'diff' : 'patch');
      });

    if (enableInline) {
      $('.rb-difflink')
        .css('cursor', 'pointer')
        .click(function() { createInlineDiff($(this)); return false; });
    }
  });
}
chrome.storage.onChanged.addListener(modifyDiffLinks, ['rewriteUnifiedLinks', 'enableInlineDiffs']);

function frameIdSuffixFromDiffHref(href) {
  return '_frame_' + href.match('/diff2?/([^/]*)/')[1].replace(':', '_');
}

// Inject some data into various DOM elements to make modifications (and
// reversals) easier.
function preparePatchSets() {
  var difflinks = $('.issue-list a[href*="/diff"]:not(.rb-difflink)')
    .addClass('rb-difflink');

  // Update rows first since frameId is based on rowId
  difflinks.closest('tr:not(.rb-diffrow)')
      .addClass('rb-diffrow')
      .each(function() {
        var row = $(this);
        var rowId = row.data().rowId;
        if (!rowId) {
          rowId = "inline_diff_row_" + currentId++;
        }
        $(this).find('a').andSelf().data({ rowId: rowId });
      });

  difflinks.each(function() {
      var href = this.href;
      var frameId = $(this).data().rowId + frameIdSuffixFromDiffHref(href);
      $(this).data({ frameId: frameId, diff: href });
      var issueList = $(this).closest('.issue-list');
      var diffColumns = issueList.data().diffColumns;
      var columnId = $(this).html();
      $(this).addClass('column' + columnId);
      console.log(columnId);
    })

  $('.issue-list a[href*="/patch/"]:not(.rb-filename)')
    .addClass('rb-filename')
    .each(function() {
      var href = this.href;
      var diffHref = href.substr(0, href.lastIndexOf('/') + 1).replace('patch', 'diff') + this.innerHTML.trim();
      var rowId = $(this).data().rowId;
      var frameId = rowId + frameIdSuffixFromDiffHref(diffHref);
      $(this).data({ patch: href, diff: diffHref, frameId: frameId });
    });
}

function setupPatchSetObserver() {
  var observer = new WebKitMutationObserver(function() {
    preparePatchSets();
    modifyDiffLinks();
  });
  $('div[id^=ps-]').each(function () { observer.observe(this, { childList: true }); });
}
setupPatchSetObserver();
preparePatchSets();
modifyDiffLinks();

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

