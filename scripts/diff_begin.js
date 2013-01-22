if (!domInspector || !domInspector.isDiff()) throw new Error('hmm');

function addStyleNode(id) {
  $(document.documentElement).append($('<style class="rb-style" id="' + id + '"/>'))
}

addStyleNode('codelineStyle');
addStyleNode('codelineColors');
addStyleNode('codelineAdjust');

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
  return selector + '{' + attr + ':' + value + ' !important' + '}\n';
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



function updateCodelineColors() {
  chrome.storage.sync.get(['changeReplaceColor', 'colorBlindMode'] , function(items) {
    if (!items['changeReplaceColor'] && !items['colorBlindMode']) {
      changeStyle('codelineColors', '');
    }

    var html = createStyle(domInspector.codelineLight(), 'display', 'inline-block');

    // The way that Rietveld does coloring is broken. So let's hack it some.
    html += createStyle(domInspector.codelineDark(), 'background-color', 'rgba(0,0,0,0)');
    html += createStyle(domInspector.codelineLight(), 'background-color', 'rgba(255,255,255,0.7)');

    var deleteColor = '#faa';
    var insertColor = '#9f9';
    var replaceColor = '#9af';

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
      deleteColor = 'rgb(255, 112, 3)';
      insertColor = 'rgb(43, 255, 162)';
      replaceColor = 'rgb(167, 112, 255)';
    }

    // Default Rietveld Colors;
    var oldReplaceColor = deleteColor;
    var newReplaceColor = insertColor;

    if (items['changeReplaceColor']) {
      oldReplaceColor = newReplaceColor = replaceColor;
    }

    html += createStyle(domInspector.codelineOldReplace(), 'background-color', oldReplaceColor);
    html += createStyle(domInspector.codelineNewReplace(), 'background-color', newReplaceColor);
    html += createStyle(domInspector.codelineOldDelete(), 'background-color', deleteColor);
    html += createStyle(domInspector.codelineNewInsert(), 'background-color', insertColor);

    changeStyle('codelineColors', html);
  });
}
updateCodelineColors();
chrome.storage.onChanged.addListener(function(changes, namespace) {
  updateCodelineColors(true);
}, ['changeReplaceColor', 'colorBlindMode']);

