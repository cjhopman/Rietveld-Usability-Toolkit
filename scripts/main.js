// TODO: We should use programmatic injection so that
// this script is only injected on correct pages.
if (!domInspector || !domInspector.isPatch()) {
  console.log(document.URL, domInspector, domInspector.isPatch());
  throw new Error('Halt execution.')
} else console.log('Found patch page... injecting.');

chrome.extension.sendMessage({action: 'show_page_action'}, function(response) {});

function createFrameForLink(link) {
  var id = link.data().frameId;
  var href = link.data().diff;
  var frame = $('<iframe id="' + id + '"/>')
    .addClass('rb-inlineDiff')
    .attr('seamless', true)
    .attr('frameBorder', '0')
    .data({ href: href })
    .hide();

  // Injecting the frame into the page is deferred until the load actually
  // begins (i.e. it's popped from the load queue). This is done because there
  // is a noticeable delay when injecting an iframe into the page, and we can
  // hide that delay with the one caused by loading the iframe. This is
  // particularly helpful for the "All xxx" buttons.
  return frame;
}

// Returns an empty collection if the frame hasn't been created.
function getFrameForLink(link) {
  return $('#' + link.data().frameId);
}

function getFrameForColumnId(row, id) {
  var difflink = row.find('.' + id);
  if (difflink.length == 0) return $();
  return getFrameForLink(difflink);
}

function updateShowingFrameId(row, newId) {
  row.data({ showingFrameId: newId });
  updateLinksForRow(row);
}

// Update the links in the previous row so that when an inline diff is shown,
// the proper link is highlighted.
function updateLinksForRow(row) {
  var showingFrameId = row.data().showingFrameId;
  var links = row.prev().find('.rb-diffLink');
  links.removeClass('rb-showingDiff');
  links.filter(function() {
      return $(this).data().frameId == row.data().showingFrameId
    }).addClass('rb-showingDiff');
}

function hideFrame(row, finished) {
  cancelLoadIfPending(row.data().loadingFrameId);
  row.data({ loadingFrameId: null });

  var frameId = row.data().showingFrameId;
  var currFrame = $('#' + frameId);
  updateShowingFrameId(row, null);
  hideSpinner(row, function() {
      row.find('.rb-frameDiv').slideUp(400, function() {
          row.hide();
          currFrame.hide();
          if (finished) finished();
        });
    });
}

function swapFrame(row, frame) {
  var frameId = row.data().showingFrameId;
  var currFrame = $('#' + frameId);
  cancelLoadIfPending(frameId);
  currFrame.hide();
  frame.show();
  updateShowingFrameId(row, frame.attr('id'));
}

function showFrame(row, frame, finished) {
  var currFrameId = row.data().showingFrameId;
  if (currFrameId) {
    swapFrame(row, frame);
    return;
  }

  row.show();
  frame.show();
  hideSpinner(row);
  updateShowingFrameId(row, frame.attr('id'));
  row.find('.rb-frameDiv').slideDown(400, function() {
      if (finished) finished();
    });
}

function toggleFrame(frame, show) {
  if (!frame.data().frameLoaded) {
    return;
  }
  var row = frame.closest('tr'),
    frameId = frame.attr('id'),
    currFrameId = row.data().showingFrameId;
  var canHide = !show;
  if (canHide && currFrameId == frameId) {
    hideFrame(row);
  } else {
    showFrame(row, frame);
  }
}

function toggleFrameForColumnId(row, column, show) {
  var difflink = row.find('.' + column);
  if (difflink.length == 0) {
    hideFrame(row.next());
  } else {
    var frame = getFrameForColumnId(row, column);
    if (frame.length > 0) {
      toggleFrame(frame, show);
    } else {
      queueFrameLoad(createFrameForLink(difflink));
    }
  }
}

function showAllFramesInColumn(table, columnId) {
  table.find('.rb-diffRow').each(function() {
    toggleFrameForColumnId($(this), columnId, true);
  });
}


function showSpinner(row, finished) {
  row.show();
  row.data({ spinnerShowing: true });
  row.find('.rb-spinner').show(0, function() {
      if (finished) finished();
    });
}

function hideSpinner(row, finished) {
  row.data({ spinnerShowing: false });
  row.find('.rb-spinner').hide(0, function() {
      if (finished) finished();
    });
}

function hideAllDiffs(tables) {
  // Hide all currently showing inline diffs.
  tables.find('.rb-frameRow').each(function() {
    hideFrame($(this));
  });
}

function queueFrameLoad(frame) {
  var frameId = frame.attr('id');
  var rowId = frameId.match('inline_diff_row_[0-9]*')[0];
  var row = $('#' + rowId);
  var priority = row.index();

  hideFrame(row, function() {
      showSpinner(row);
    });

  row.data({ loadingFrameId: frameId });

  pushLoadQueue(frameId, priority, function(finished) {
    chrome.storage.sync.get(['autoSetColumnWidth', 'columnWidthMap'], function(items) {
      var src = frame.data().href;
      if (items['autoSetColumnWidth'])
        src = domInspector.adjustUrlForColumnWidth(src, items['columnWidthMap']);

      row.find('.rb-frameDiv')
        .append(frame);

      frame.one('load', function() {
        iframeLoaded(frameId);
        if (row.data().loadingFrameId == frameId) {
          row.find('.rb-frameDiv').css('min-height', '50px');
          showFrame(row, frame, function() {
            row.find('.rb-frameDiv').css('min-height', '');
          });
        }
        if (finished) finished();
      });

      frame.attr('src', src);
      //frame.attr('src', 'data:text/html,<html><body><iframe src="' + src + '"></iframe></body></html>');
    });
  });
}

function toggleFrameForLink(link) {
  toggleFrameForColumnId(link.closest('.rb-diffRow'), link.data().columnId);
}

function iframeLoaded(id) {
  var frame = $('#' + id);
  var frameDiv = frame.closest('.rb-frameDiv');
  frame.data({ frameLoaded: true });
  var row = frame.closest('tr');

  var inner = frame.contents();

  var resizer = function() {
    var newHeight = inner.find('html').height();
    var newWidth = inner.find('html').width();
    if (frame.css('height') != newHeight || frame.css('width') != newWidth) {
      frameDiv.css('height', newHeight).css('width', newWidth);
      // Chrome 23 requires that the frame be resized.
      frame.css('height', newHeight).css('width', newWidth);
    }
  };

  domInspector.adjustDiffFrameForInline(inner);

  // The observer must be installed before the first resizer() call (otherwise
  // we may miss a modification between the resizer() call and observer
  // installation).
  var observer = new WebKitMutationObserver(resizer);
  inner.find('html').each(function() {
      observer.observe(this, { attributes: true, subtree: true } );
    });

  // FIXME: Calling resizer() here should work, but somehow it causes a bug
  // where the frame sometimes overlaps the next row after load.
  //resizer();

  // Force a reflow after a short time. This "fixes" a bug where comments are not
  // displayed on first load (100% reproducible on
  // https://codereview.appspot.com/6493094/).
  setTimeout(function() { inner.find('html').toggleClass('rb-forceReflow'); }, 100);
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
        .click(function(ev) {
          if (ev.button == 0) {
            toggleFrameForLink($(this));
            ev.preventDefault();
            ev.stopImmediatePropagation();
            ev.stopPropagation();
          }
        })
        .mouseup(function(ev) {
          ev.preventDefault();
          ev.stopImmediatePropagation();
          ev.stopPropagation();
        })
        .mousedown(function(ev) {
          ev.preventDefault();
          ev.stopImmediatePropagation();
          ev.stopPropagation();
        });
    }
  });
}
chrome.storage.onChanged.addListener(updatePatchTables, ['rewriteUnifiedLinks', 'enableInlineDiffs', 'createViewAllButtons']);

function addShowButton(cell, columnId, text) {
  if (cell.find('.' + columnId).length > 0) return;

  var button = $('<input type="button" value="' + text + '"/>')
    .addClass('rb-headerButton')
    .addClass('rb-blueButton')
    .addClass(columnId)
    .data({ columnId: columnId })
    .click(function() {
      showAllFramesInColumn(cell.closest('.rb-patchTable'), columnId);
    });
  var siblingsBefore = cell.find('input').filter(function() {
    var otherId = $(this).data().columnId;
    if (otherId.length < columnId.length) return true;
    return otherId < columnId;
  });
  if (siblingsBefore.length > 0) {
    siblingsBefore.last().after(button);
  } else {
    cell.prepend(button);
  }
}

function createSpinner() {
  var spinnerDiv = $('<div/>')
    .addClass('rb-spinnerDiv')
    .css('text-align', 'center');
  var spinner = $('<div/>')
    .addClass('rb-spinner')
    .css('height', '50px')
    .css('margin', 'auto');
  for (var i = 0; i < 12; i++) {
    spinner.append($('<div/>').addClass('rb-bar' + i));
  }
  return spinnerDiv.append(spinner);
}

function createFrameDiv() {
  return $('<div/>')
    .addClass('rb-frameDiv')
    .css('margin', 'auto')
    .hide();
}

function createFrameContainer() {
  return div = $('<div/>')
    .addClass('rb-frameContainer')
    .css('width', '100%')
    .append(createSpinner())
    .append(createFrameDiv());
}

function createFrameRow() {
  return $('<tr id="' + rowId + '"/>')
    .addClass('rb-frameRow')
    .data({ showingFrameId: null })
    .append(
      $('<td colspan=1000/>')
        .append(createFrameContainer()))
    .hide();
}

function createHideAllButton() {
  return $('<input type="button" value="Hide all"/>')
    .addClass('rb-headerButton')
    .addClass('rb-redButton')
    .click(function() {
      hideAllDiffs($(this).closest('.rb-patchTable'));
    });
}

var currentId = 0;
// Inject some data and elements to the DOM to make modifications (and
// reversals) easier.
function injectDataAndNodes() {
  // Modify table header rows.
  var newPatchTables = domInspector.findPatchTables()
    .filter(':not(.rb-patchTable)')
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
      hideAll.append(createHideAllButton());

      unified.append(hideAll);

      var diff = unified.next()
        .addClass('rb-diffHeader')
        .html('');

      addShowButton(diff, 'rb-columnView', 'Show All');

      var delta = diff.next()
        .addClass('rb-deltaHeader')
        .html('');
    });

  var difflinks = domInspector.findDiffLinks()
    .filter(':not(.rb-diffLink)')
    .addClass('rb-diffLink');

  // Update rows first since frameId is based on rowId
  difflinks.closest('tr:not(.rb-diffRow)')
    .addClass('rb-diffRow')
    .each(function() {
      rowId = 'inline_diff_row_' + currentId++;

      $(this).find('a').andSelf().data({ rowId: rowId });

      $(this).after(createFrameRow(rowId));
    });

  difflinks.each(function() {
    var href = this.href;
    var frameId = $(this).data().rowId + domInspector.frameIdSuffixFromDiffHref(href);
    $(this).data({ frameId: frameId, diff: href });
    var html = $(this).html().trim();
    var columnId = 'rb-column' + domInspector.columnIdFromHtml(html);
    $(this).addClass(columnId);
    $(this).data({ columnId: columnId});
    // For columnId == 'rb-columnView' the button is installed above.
    if (columnId != 'rb-columnView') {
      var cell = $(this).closest('.rb-patchTable').find('.rb-deltaHeader');
      addShowButton(cell, columnId, 'All ' + html);
    }
  })

  domInspector.findUnifiedLinks()
    .filter(':not(.rb-filename)')
    .addClass('rb-filename')
    .addClass('rb-columnView')
    .data({ columnId: 'rb-columnView'})
    .each(domInspector.unifiedLinkRewriter());
}

function setupPatchSetObserver() {
  // TODO: These observers are only needed to detect the loading of patch set
  // data, we should be able to disconnect them from each patch set after its
  // loaded.
  var observer = new WebKitMutationObserver(function() {
    injectDataAndNodes();
    updatePatchTables();
  });
  domInspector.findPatchContainers()
    .filter(':not(.rb-patchContainer)')
    .addClass('rb-patchContainer')
    .each(function () { observer.observe(this, { childList: true, subtree: true}); });
}
setupPatchSetObserver();
injectDataAndNodes();
updatePatchTables();
domInspector.modifyPatchPage();


function enableAnimations() {
  chrome.storage.sync.get('enableAnimations', function(items) {
    $.fx.off = !items['enableAnimations'];
  });
}
enableAnimations();
chrome.storage.onChanged.addListener(function(changes, namespace) {
  enableAnimations();
}, 'enableAnimations');
