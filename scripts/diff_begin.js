if (!domInspector || !domInspector.isDiff()) throw new Error('hmm');

function addStyleNode(id) {
  $(document.documentElement).append($('<style class="rb-style" id="' + id + '"/>'))
}
function addStyleLink(id) {
  $(document.documentElement).append($('<link class="rb-styleLink" type="text/css" rel="stylesheet" id="' + id + '"/>'));
}

addStyleLink('rb-syntaxTheme');

addStyleNode('codelineStyle');
addStyleNode('codelineColors');
addStyleNode('codelineAdjust');
addStyleNode('codelineFontSize');
addStyleNode('codelineSelectionFixer');
addStyleNode('lineNumberColor');

var changeStyleId = 0;
function changeStyle(id, style) {
  var node = $('#' + id);
  node.html(style);

  // If this diff is displayed inline in a containing patch set page, we need
  // the installed mutation observer to be triggered to possibly resize the
  // iframe. Changing a class on this node will trigger the observer.
  node.toggleClass('rb-trigger');
}

function createStyle(selector, attr, value) {
  if (typeof(selector) == 'string') selector = [selector];
  return $.map(selector, function(sel) { return sel + '{' + attr + ':' + value + ' !important' + '}\n'; }).join('\n');
}

function updateCodelineFont() {
  chrome.storage.sync.get(['codeFontEnabled', 'codeFont'] , function(items) {
    var html = '';
    if (items['codeFontEnabled']) {
      html = createStyle(domInspector.codelineAll(), 'font-family', items['codeFont'] + ', monospace')
    }
    changeStyle('codelineStyle', html);
  });
}
updateCodelineFont();
chrome.storage.onChanged.addListener(function(changes, namespace) {
  updateCodelineFont();
}, ['codeFontEnabled', 'codeFont']);

function updateCodelineFontSize() {
  chrome.storage.sync.get(['codeFontSizeEnabled', 'codeFontSize'] , function(items) {
    var html = '';
    console.log(items)
    console.log(items['codeFontSizeEnabled'])
    if (items['codeFontSizeEnabled']) {
      html = createStyle(domInspector.codelineAll(), 'font-size', items['codeFontSize'])
    }
    changeStyle('codelineFontSize', html);
  });
}
updateCodelineFontSize();
chrome.storage.onChanged.addListener(function(changes, namespace) {
  updateCodelineFontSize();
}, ['codeFontSizeEnabled', 'codeFontSize']);

function updateCodelineColors() {
  chrome.storage.sync.get(['changeReplaceColor', 'colorBlindMode'] , function(items) {
    if (!items['changeReplaceColor'] && !items['colorBlindMode']) {
      changeStyle('codelineColors', '');
    }

    var html = createStyle(domInspector.codelineLight(), 'display', 'inline-block');

    var deleteColor = [255, 175, 175];
    var insertColor = [159, 255, 159];
    var replaceColor = [159, 175, 255];

    if (items['colorBlindMode']) {
      // From Cynthia Brewer's colorbrewer2.
      // deleteColor = 'rgb(217, 95, 2)';
      // insertColor = 'rgb(27, 158, 119)';
      // replaceColor = 'rgb(117, 112, 179)';
      // And lightened (in HSV-space and back) up a bit:
      // deleteColor = 'rgb(255, 112, 3)';
      // insertColor = 'rgb(43, 255, 192)';
      // replaceColor = 'rgb(167, 161, 255)';
      // And modified just slightly after playing with compiz filters:
      deleteColor = [255, 112, 3];
      insertColor = [43, 255, 162];
      replaceColor = [167, 112, 255];
    }

    // Default Rietveld Colors;
    var oldReplaceColor = deleteColor;
    var newReplaceColor = insertColor;

    if (items['changeReplaceColor']) {
      oldReplaceColor = newReplaceColor = replaceColor;
    }

    function toColor(col, al) {
      al = al || 0.0;
      return 'rgb(' + String(Math.floor(col[0]  + (255 - col[0]) * al))
          + ',' + String(Math.floor(col[1] + (255 - col[1]) * al)) + ','
          + String(Math.floor(col[2] + (255 - col[2]) * al)) + ')';
    }

    html += createStyle(domInspector.codelineOldDelete(), 'background-color', toColor(deleteColor));
    html += createStyle(domInspector.codelineNewInsert(), 'background-color', toColor(insertColor));

    html += createStyle(domInspector.codelineOldReplaceDark(), 'background-color', toColor(oldReplaceColor));
    html += createStyle(domInspector.codelineNewReplaceDark(), 'background-color', toColor(newReplaceColor));
    html += createStyle(domInspector.codelineOldReplaceLight(), 'background-color', toColor(oldReplaceColor, 0.7));
    html += createStyle(domInspector.codelineNewReplaceLight(), 'background-color', toColor(newReplaceColor, 0.7));

    changeStyle('codelineColors', html);
  });
}
updateCodelineColors();
chrome.storage.onChanged.addListener(function(changes, namespace) {
  updateCodelineColors(true);
}, ['changeReplaceColor', 'colorBlindMode']);

function updateLineNumberColor() {
  chrome.storage.sync.get(['lineNumberColorEnabled'] , function(items) {
    var html = '';
    if (items['lineNumberColorEnabled']) {
      html = createStyle('.rb-lineNumber', 'color', 'rgb(128, 128, 128)')
    }
    changeStyle('lineNumberColor', html);
  });
}
updateLineNumberColor();
chrome.storage.onChanged.addListener(function(changes, namespace) {
  updateLineNumberColor();
}, ['lineNumberColorEnabled']);


function fixDarkLines() {
  var html = createStyle(domInspector.codelineDark(), 'display', 'inline-block');
  changeStyle('codelineAdjust', html);
}
fixDarkLines();

