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
  var rowId = fromRow.data(TAG).rowId;
  var newRow = $("#" + rowId);
  if (newRow.length) return newRow;

  newRow = $('<tr id="' + rowId + '"></tr>');
  newRow.data(TAG, { showingFrameId: null });
  var newCell = $('<td colspan=1000></td>');
  var div = $('<div style="margin:0 auto; width:100%; height:100%; text-align:center"/>');
  fromRow.after(newRow);
  return newRow.append(newCell.append(div));
}

function getDiffFrame(el) {
  var frameId = el.data(TAG).frameId;
  var frame = $("#" + frameId);
  if (frame.length) return frame;
  var newRow = getDiffRow(el);

  var newFrame = $('<iframe id="' + frameId + '" src="javascript:false" style="width:100%; display: none" frameBorder="0"/>');
  newRow.find('div').append(newFrame);
  return newFrame;
}

function hideFrame(row) {
  var currFrame = $('#' + row.data(TAG).showingFrameId);
  if (currFrame.length < 1) {
    throw new Error('No current frame found?!?!');
  }
  // TODO: animate
  row.hide();
  currFrame.hide();
  row.data(TAG, { showingFrameId: null });
}

function showFrame(row, frame) {
  var currFrameId = row.data(TAG).showingFrameId;
  if (currFrameId) {
    swapFrame(row, frame);
    return;
  }

  // TODO: animate
  row.show();
  frame.show();
  row.data(TAG, { showingFrameId: frame.attr('id') });
}

function swapFrame(row, frame) {
  var currFrame = $('#' + row.data(TAG).showingFrameId);
  if (currFrame.length < 1) {
    throw new Error('No current frame found?!?!');
  }
  currFrame.hide();
  frame.show();
  row.data(TAG, { showingFrameId: frame.attr('id') });
}

function toggleFrame(frame) {
  var row = frame.closest('tr');
  var frameId = frame.attr('id');
  var currFrameId = row.data(TAG).showingFrameId;
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
  var prevRow = row.prev();
  var links = prevRow.find('a');
  links.each(function() {
    var anchor = $(this);
    if (!anchor.data(TAG)) {
      return;
    }
    var frameId = anchor.data(TAG).frameId;
    var isShowing = row.data(TAG).showingFrameId == frameId;
    anchor.toggleClass('rb-showingDiff', isShowing);
  });
}

function createInlineDiff(el) {
  var frame = getDiffFrame(el);
  var currentSrc = frame.attr('src');
  var newSrc = el.data(TAG).href;
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
    if (row.data(TAG).showingFrameId) {
      hideFrame(row);
    }
    row.show();
    frame.attr('src', newSrc);
    frame.load(iframeLoaded(frame.attr("id")));
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

function modifyLinksToInline(issueLists) {
  chrome.storage.sync.get('rewriteUnifiedLinks', function(items) {
    if (items['rewriteUnifiedLinks']) {
      issueLists.find('a[href*="/patch/"]').addClass('rb-filename').each(function() {
        var href = this.href;
        this.href = href.substr(0, href.lastIndexOf('/') + 1).replace('patch', 'diff') + this.innerHTML.trim();
      });
    }
    issueLists.find('a[href*="/diff"]').each(function() {
      var link = $(this);
      if (link.data(TAG)) return;
      var row = link.closest("tr");
      if (!row.data(TAG) || !row.data(TAG).rowId) {
        row.data(TAG, { rowId: "inline_diff_row_" + currentId++ });
      }
      var rowId = row.data(TAG).rowId;

      link.data(TAG, {
        href: this.href,
        frameId: rowId + "_frame_" + this.href.match('/diff2?/([^/]*)/')[1].replace(':', '_')
      });
      link.css('cursor', 'pointer').click(function () { createInlineDiff($(this)); return false; });
    })
  });
}

function setupPatchSetObserver() {
  var observer = new WebKitMutationObserver(function() {
    modifyLinksToInline($('.issue-list'));
  });
  $('div[id^=ps-]').each(function () { observer.observe(this, { childList: true }); });
}
setupPatchSetObserver();
modifyLinksToInline($('.issue-list'));

// The baseurl is often long and makes the whole left pane too long... hide it.
function hideBaseUrl(shouldHide) {
  if (shouldHide) {
    $('.issue_details_sidebar').children().eq(4).hide();
    $('.meta').attr('width', '10%');
  } else {
    if ($('.meta').attr('width')[0] == '10%') {
      $('.meta').attr('width', '20%');
    }
    $('.issue_details_sidebar').children().eq(4).show();
  }
}

chrome.storage.sync.get({ 'hideBaseUrl': true }, function(items) {
  hideBaseUrl(items['hideBaseUrl']);
});
chrome.storage.onChanged.addListener(function(changes, namespace) {
  hideBaseUrl(changes['hideBaseUrl'].newValue);
}, 'hideBaseUrl');

