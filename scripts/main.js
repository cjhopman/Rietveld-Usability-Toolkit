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

if (useInconsolata()) {
  //$(document).find('head').append('<style> ' + codelineSelector + '{ font-family: Inconsolata, monospace; } </style>');
}
function updateCodelineFont() {
  fontFamily = 'monospace';
  if (useInconsolata()) {
    fontFamily = 'Inconsolata, ' + fontFamily;
  }
  $(codelineSelector).css('font-family', fontFamily);
}
//updateCodelineFont();


var currentId = 0;
var TAG = "prettifier";

function getDiffFrame(el) {
  var currentRow = $(el).closest("tr");
  var frameId = currentRow.data(TAG).iframeId;
  var frame = $("#" + frameId);
  if (frame.length) return frame;

  var newCell = $('<td colspan=1000></td>');
  var newRow = $('<tr></tr>');
  newCell.appendTo(newRow);
  var newFrame = $('<iframe id="' + frameId + '" src="javascript:false" style="width:100%; display: none"/>');
  newFrame.appendTo(newCell);
  currentRow.after(newRow);
  return newFrame;
}

function createInlineDiff(el) {
  var frame = getDiffFrame(el);
  var currentSrc = frame.attr('src');
  var newSrc = $(el).data(TAG).href;
  if (currentSrc == newSrc) {
    frame.toggle();
    frame.closest("tr").toggle();
    return;
  }

  frame.hide();
  frame.closest("tr").show();
  frame.attr('src', $(el).data(TAG).href);
  frame.load(iframeLoaded(frame.attr("id")));
}

function iframeLoaded(id) {
  return function() {
    var frame = $("#" + id);
    var inner = frame.contents();
    var code = inner.find(".code");
    code.parents().add(code).each(function() { $(this).siblings().hide(); });
    code.find(".codenav").hide();

    // From the loaded styles.css.
    var codelines = ".olddark, .newdark, .oldreplace, .olddelete, .oldinsert, .oldequal, .oldblank, .oldlight, .newlight, .oldreplace1, .newreplace1, .newreplace, .newdelete, .newinsert, .newequal, .newblank, .oldmove, .oldchangemove, .oldchangemove1, .oldmove_out, .oldchangemove_out, .newmove, .newchangemove, .newchangemove1, .udiffadd, .udiffremove, .udiff, .debug-info";
    //code.find(codelines).css("font-family", "Inconsolata, monospace");
    var resizer = function() {
      if (frame.css('height') != inner.outerHeight(true))
        frame.css('height', inner.outerHeight(true));
      console.log(inner.height());
      console.log(inner.outerHeight(true));
      console.log(inner);
    };
    frame.css("height", inner.height());
    var observer = new WebKitMutationObserver(resizer);
    observer.observe(code[0], { attributes: true, subtree: true } );
    setTimeout(function() { resizer(); frame.show(); }, 0);
  }
}

function modifyLinksToInline(issueLists) {
  issueLists.find('a').filter(function() { return this.href.indexOf('diff') >= 0; }).each(function() {
    link = $(this);
    if (link.data(TAG)) return;
    link.data(TAG, {
      href: this.href,
    });
    row = link.closest("tr");
    if (!row.data(TAG) || !row.data(TAG).iframeId) {
      row.data(TAG, { iframeId: "inline_diff_" + currentId++ });
    }
    link.css('cursor', 'pointer').click(function () { createInlineDiff(this); return false; });
  })
}

function setupPatchSetObserver() {
  var observer = new WebKitMutationObserver(function() {
    modifyLinksToInline($('.issue-list'));
  });
  $('[id^=ps-]').filter('div').each(function () { observer.observe(this, { childList: true }); });
}
setupPatchSetObserver();


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
  if ('hideBaseUrl' in changes) {
    hideBaseUrl(changes['hideBaseUrl'].newValue);
  }
});


// Automatically set the column width based on the filetype. For the inline diff
// frames, the form to change the column width has been hidden, so this is kinda
// important.
function setColumnWidthTo(value) {

}
function setInitialColumnWidth() {

}

chrome.storage.sync.get({ 'autoSetColumnWidth': true }, function (items) {
  if (items['autoSetColumnWidth']) {
    setInitialColumnWidth();
  }
});

modifyLinksToInline($('.issue-list'));
