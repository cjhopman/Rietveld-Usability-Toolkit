chrome.extension.sendMessage({}, function(response) {});

// It's expensive to inject all the iframes on startup, so do it lazily.
function getFrameById(id) {
  var frame = $("#" + id);
  if (frame.length == 0) {
    frame = $('<iframe id="' + id + '" style="width:100%" frameBorder="0"/>')
      .hide()
      .addClass('rb-inlineDiff');
    var rowId = id.match('inline_diff_row_[0-9]*')[0];
    $('#' + rowId)
      .find('.rb-frameDiv')
      .append(frame);
  }
  return frame;
}

function hideFrame(row) {
  var currFrame = $('#' + row.data().showingFrameId);
  if (currFrame.length < 1) {
    throw new Error('No current frame found?!?!');
  }
  row.data({ showingFrameId: null });

  row.find('.rb-frameDiv').slideUp(500, function() {
    row.hide();
    currFrame.hide();
  });
}

function swapFrame(row, frame) {
  var currFrame = $('#' + row.data().showingFrameId);
  if (currFrame.length < 1) {
    throw new Error('No current frame found?!?!');
  }
  currFrame.hide();
  frame.show();
  row.data({ showingFrameId: frame.attr('id') });
  row.find('.rb-frameDiv').slideDown(500);
}

function showFrame(row, frame) {
  var currFrameId = row.data().showingFrameId;
  if (currFrameId) {
    swapFrame(row, frame);
    return;
  }

  row.show();
  frame.show();
  row.data({ showingFrameId: frame.attr('id') });
  row.find('.rb-frameDiv').slideDown(500);
}

function toggleFrame(frame) {
  var row = frame.closest('tr'),
    frameId = frame.attr('id'),
    currFrameId = row.data().showingFrameId;
  if (currFrameId == frameId) {
    hideFrame(row);
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
  var links = row.prev().find('.rb-diffLink');
  links.each(function() {
    var anchor = $(this);
    var frameId = anchor.data().frameId;
    var isShowing = row.data().showingFrameId == frameId;
    anchor.toggleClass('rb-showingDiff', isShowing);
  });
}

function queueFrameLoad(frame, src) {
  var priority = frame.closest('tr').index();
  var frameId = frame.attr('id');
  pushLoadQueue(frameId, priority, function(finishedCallback) {
    frame.attr('src', src);
    frame.one('load', function() {
      iframeLoaded(frame.attr('id'));
      finishedCallback();
    });
  });
}

function createInlineDiff(el) {
  chrome.storage.sync.get(['autoSetColumnWidth', 'columnWidthMap'], function(items) {
    var newSrc = el.data().diff;
    if (items['autoSetColumnWidth']) {
      var filetype = newSrc.substr(newSrc.lastIndexOf('.') + 1);
      if (filetype in items['columnWidthMap'])
        newSrc += '?column_width=' + items['columnWidthMap'][filetype];
    }
    var frame = getFrameById(el.data().frameId);
    if (frame.data().frameLoaded) {
      toggleFrame(frame);
      return;
    }
    var row = $('#' + el.data().rowId);
    if (row.data().showingFrameId) {
      hideFrame(row);
    }
    row.show();
    queueFrameLoad(frame, newSrc);
  });
}

function removeDiffChrome(page) {
  var code = page.find(".code");
  code.parents().andSelf()
    .css('margin', '0')
    .css('display', 'table')
    .siblings()
      .hide();
  code.find(".codenav").hide();
}

function iframeLoaded(id) {
  var frame = $("#" + id);
  frame.data({ frameLoaded: true });
  var row = frame.closest('tr');

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
  // Sometimes we get scrollbars in the frame when we don't actually need them.
  // Let's hammer those away. (What happens when we actually need them?)
  inner.find('html').css('overflow', 'hidden')

  // The observer must be installed before the first resizer() call (otherwise
  // we may miss a modification between the resizer() call and observer
  // installation).
  var observer = new WebKitMutationObserver(resizer);
  observer.observe(inner[0], { attributes: true, subtree: true } );
  resizer();
  toggleFrame(frame);
}

function hideAllDiffs(tables) {
  // Hide all currently showing inline diffs.
  tables.find('.rb-showingDiff').removeClass('rb-showingDiff');
  tables.find('.rb-frameDiv').slideUp(500, function() {
    $(this).closest('.rb-frameRow').hide().data({'showingFrameId': null});
  });
}

function updatePatchTables() {
  chrome.storage.sync.get(['rewriteUnifiedLinks', 'enableInlineDiffs', 'createViewAllButtons'], function(items) {
    var shouldRewrite = items['rewriteUnifiedLinks'];
    var enableInline = items['enableInlineDiffs'];
    var createViewAll = items['createViewAllButtons'];

    $('.rb-tableHeader.rb-modified').toggle(createViewAll);
    $('.rb-tableHeader.rb-original').toggle(!createViewAll);

    if (!enableInline) {
      hideAllDiffs($('.rb-patchTable'));
    }

    $('.rb-diffLink').off('click');

    $('.rb-filename')
      .toggleClass('rb-diffLink', shouldRewrite)
      .each(function() {
        this.href = $(this).data(shouldRewrite ? 'diff' : 'patch');
      });

    if (enableInline) {
      $('.rb-diffLink')
        .click(function() { createInlineDiff($(this)); return false; });
    }
  });
}
chrome.storage.onChanged.addListener(updatePatchTables, ['rewriteUnifiedLinks', 'enableInlineDiffs', 'createViewAllButtons']);

function frameIdSuffixFromDiffHref(href) {
  return '_frame_' + href.match('/diff2?/([^/]*)/')[1].replace(':', '_');
}

function addShowButton(cell, columnId, text) {
  if (cell.find('.' + columnId).length > 0) return;

  var button = $('<input type="button" value="' + text + '"/>')
    .addClass('rb-headerButton')
    .addClass('rb-blueButton')
    .addClass(columnId)
    .data({ columnId: columnId })
    .click(function() {
      cell.closest('.rb-patchTable').find('a.' + columnId).click();
    })
  var siblingsBefore = cell.find('input').filter(function() {
    return $(this).data().columnId < columnId;
  });
  if (siblingsBefore.length > 0) {
    siblingsBefore.last().after(button);
  } else {
    cell.prepend(button);
  }
}

var currentId = 0;
// Inject some data and elements to the DOM to make modifications (and
// reversals) easier.
function injectDataAndNodes() {
  // Modify table header rows.
  $('.issue-list table:not(.rb-patchTable)')
    .addClass('rb-patchTable')
    .find('tr:first-of-type')
    .addClass('rb-tableHeader')
    .addClass('rb-original')
    .each(function() {
      var modified = $(this).clone()
        .removeClass('rb-original')
        .addClass('rb-modified')
        .hide();
      $(this).after(modified);

      modified.children().addClass('rb-headerCell');

      var unified = modified.children().eq(1)
        .addClass('rb-unifiedHeader');
      var hideAll = $('<div/>')
        .addClass('rb-hideAll')
        .css('float', 'right');
      hideAll.append(
        $('<input type="button" value="Hide all"/>')
          .addClass('rb-headerButton')
          .addClass('rb-redButton')
          .click(function() {
            hideAllDiffs($(this).closest('.rb-patchTable'));
          }));

      unified.append(hideAll);

      var diff = unified.next()
        .addClass('rb-diffHeader')
        .html('');

      addShowButton(diff, 'rb-columnView', 'Show All');

      var delta = diff.next()
        .addClass('rb-deltaHeader')
        .html('');
    });


  var difflinks = $('.issue-list a[href*="/diff"]:not(.rb-diffLink)')
    .addClass('rb-diffLink');

  // Update rows first since frameId is based on rowId
  difflinks.closest('tr:not(.rb-diffRow)')
    .addClass('rb-diffRow')
    .each(function() {
      rowId = "inline_diff_row_" + currentId++;

      $(this).find('a').andSelf().data({ rowId: rowId });

      newRow = $('<tr id="' + rowId + '"/>')
        .addClass('rb-frameRow')
        .data({ showingFrameId: null })
        .append(
          $('<td colspan=1000/>')
            .append(
              $('<div/>')
                .addClass('rb-frameDiv')
                .hide()
                .css({
                  overflow: 'hidden',
                  width: '100%'
                  })
                .css('text-align', 'center')))
        .hide();
      $(this).after(newRow);
    });

  difflinks.each(function() {
    var href = this.href;
    var frameId = $(this).data().rowId + frameIdSuffixFromDiffHref(href);
    $(this).data({ frameId: frameId, diff: href });
    var issueList = $(this).closest('.issue-list');
    var diffColumns = issueList.data().diffColumns;
    var html = $(this).html().trim();
    var columnId = 'rb-column' + html;
    $(this).addClass(columnId);
    // For columnId == 'rb-columnView' the button is installed above.
    if (columnId != 'rb-columnView') {
      var cell = $(this).closest('.issue-list').find('.rb-deltaHeader');
      addShowButton(cell, columnId, 'All ' + html);
    }
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
  // TODO: These observers are only needed to detect the loading of patch set
  // data, we should be able to disconnect them from each patch set after its
  // loaded.
  var observer = new WebKitMutationObserver(function() {
    injectDataAndNodes();
    updatePatchTables();
  });
  $('div[id^=ps-]').each(function () { observer.observe(this, { childList: true }); });
}
setupPatchSetObserver();
injectDataAndNodes();
updatePatchTables();

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

