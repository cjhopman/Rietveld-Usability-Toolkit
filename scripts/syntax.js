var codeLines = [];

function updateSyntaxTheme() {
  chrome.storage.sync.get('syntaxTheme', function(items) {
      var theme = items['syntaxTheme'];
      var path = chrome.extension.getURL('lib/syntax/themes/shTheme' + theme + '.css');
      $('#rb-syntaxTheme').attr('href', path);
    });
}
updateSyntaxTheme();
chrome.storage.onChanged.addListener(function() {
  updateSyntaxTheme();
}, ['syntaxTheme']);

function appendCodeRow(arr, column) {
  return function() {
    var self = $(this);
    var row = self.closest('tr');
    arr.push({
      self: self,
      clone: self.clone(),
      text: self.text(),
      line: parseInt(row.attr('id').substring(5)),
      column: column,
      matches: []
    });
  };
}

function findMatches(code, brush) {
  var matches = [];

  // Find all matches.
  $.map(brush.regexList, function(regexInfo) {
    var func = regexInfo.func || function(match) { return match[0] };
    var match;
    while ((match = regexInfo.regex.exec(code)) != null) {
      var result = func.call(regexInfo, match);
      if (typeof(result) == 'string') {
        matches.push(new SyntaxHighlighter.Match(result, match.index, regexInfo.css));
      }
    }
  });
  matches.sort(function(l, r) { return l.index - r.index; });

  var position = 0;
  // Remove overlapping matches.
  matches = matches.filter(function(v, idx) {
      if (v.index < position) return false;
      position = v.index + v.length;
      return true;
    });
  return matches;
}


function splitToBlocks(arr, breaks) {
  // Splits codelines into blocks (separated by the splits).
  var blocks = [];
  var nextBreakIdx = 0;
  var nextBreak = breaks[nextBreakIdx++];
  $.each(arr, function(_, line) {
      if (line.column > nextBreak.column || line.line > nextBreak.line) {
        blocks.push({
            rows: [],
            text: '',
            map: []
          });
        nextBreak = breaks[nextBreakIdx++];
      }
      var block = blocks[blocks.length - 1];
      block.rows.push(line);
      block.text += line.text + '\n';
      block.map.push(block.text.length);
      lastLine = line;
    });
  return blocks;
}

function applyMatchesToText(matches, text, offset) {
  var html = $('<span>');
  var position = 0;

  for (var i = 0; i < matches.length; i++) {
    var match = matches[i];
    var matchIndex = match.rowIndex - offset;
    if (matchIndex < 0 || matchIndex >= text.length)
      return;
    var matchLength = Math.min(match.length, text.length - matchIndex);
    if (matchIndex != position) {
      html.append(
        document.createTextNode(text.substring(position, matchIndex)));
    }
    html.append($('<span/>').addClass(match.css).append(
        document.createTextNode(text.substring(matchIndex, matchIndex + matchLength))));
    position = matchIndex + matchLength;
  }
  html.append(document.createTextNode(text.substring(position)));
  return [html, text.length];
}

function applyMatchesToHtml(matches, html, offset) {
  var contents = html.contents();
  var res = html.html('');
  var offset = offset || 0;
  for (var i = 0; i < contents.length; i++) {
    var el = contents[i];
    var inner = null;
    if (el.nodeType == 3) {
      inner = applyMatchesToText(matches, el.nodeValue, offset);
    } else {
      inner = applyMatchesToHtml(matches, $(el), offset);
    }
    res.append(inner[0]);
    offset += inner[1];
  }
  return [res, offset];
}

function applyMatchesForRow(row) {
  row.displayHtml = applyMatchesToHtml(row.matches.slice(), row.clone.clone(), 0)[0]
}

function updateDisplayedHtml(codeBlocks) {
  for (var i = 0; i < codeBlocks.length; i++) {
    var block = codeBlocks[i];
    for (var j = 0; j < block.rows.length; j++) {
      var row = block.rows[j];
      row.self.html(row.displayHtml);
    }
  }
}
timingDecorator('updateDisplayedHtml')
function highlightCode(brush) {
  var breaks = domInspector.getCodeBreaks().concat([Infinity]);
  breaks = [{ column: -1, line: -1 }]
    .concat($.map(breaks, function(v) { return { column: 0, line: v }; }))
    .concat($.map(breaks, function(v) { return { column: 1, line: v }; }));

  var codeBlocks = splitToBlocks(codeLines, breaks);
  $.each(codeBlocks, function(_, bl) { bl.matches = findMatches(bl.text, brush) });

  for (var i = 0; i < codeBlocks.length; i++) {
    var block = codeBlocks[i];
    // Split matches at line breaks.
    for (var j = 0; j < block.matches.length; j++) {
      var match = block.matches[j];
      var rowIdx = block.map.lowerBound(match.index + 1);
      match.rowIndex = match.index;
      if (rowIdx > 0) match.rowIndex -= block.map[rowIdx - 1];
      block.rows[rowIdx].matches.push(match);
      while (match.index + match.length > block.map[rowIdx]) {
        var splitMatch = $.extend({}, match);
        splitMatch.rowIndex = 0;
        splitMatch.length = (match.index + match.length) - block.map[rowIdx];
        rowIdx++;
        block.rows[rowIdx].matches.push(splitMatch);
      }
    }

    for (var j = 0; j < block.rows.length; j++) {
      var row = block.rows[j];
      applyMatchesForRow(row);
    }
  }
  updateDisplayedHtml(codeBlocks);

  $(domInspector.codeTableBody()).addClass('syntaxhighlighter');
}
timingDecorator('highlightCode')

function clearHighlight() {
  $.each(codeLines, function(_, line) {
      line.self.html(line.clone.html());
    });
}

function updateCodeLines() {
  // TODO: I shouldn't have to worry about calling taglinenumbers... it should just happen.
  tagLineNumbers();
  $(domInspector.codelineNew())
    .find('.rb-code')
    .filter(':not(.rb-codeProcessed)')
    .addClass('rb-codeProcessed')
    .each(appendCodeRow(codeLines, 0));

  $(domInspector.codelineOld())
    .find('.rb-code')
    .filter(':not(.rb-codeProcessed)')
    .addClass('rb-codeProcessed')
    .each(appendCodeRow(codeLines, 1));

  codeLines.sort(function(l, r) { return l.column != r.column ? l.column - r.column : l.line - r.line; });

  // There may be matches from before, clear them.
  $.each(codeLines, function(_, line) { line.matches = []; });
}
timingDecorator('updateCodeLines')

function processCode(brush) {
  updateCodeLines();
  chrome.storage.sync.get('enableSyntaxHighlight', function(items) {
    if (items['enableSyntaxHighlight']) {
      highlightCode(brush);
    } else {
      clearHighlight();
    }
  });
}

function identifyBrush() {
  var path = window.location.pathname;
  var extension = path.indexOf('.') < 0 ? '' : path.substring(path.indexOf('.') + 1);
  var brush = null;
  $.each(brushes, function(_, b) {
      if (b.extensions.indexOf(extension) >=0) {
        brush = b;
      }
    });
  return brush;
}

var brush = identifyBrush();

var highlightInitialized = false;
function initializeHighlighting() {
  brush.brush = new SyntaxHighlighter.brushes[brush.name]()
  processCode(brush.brush);
  domInspector.observeNewCodelines(function() { processCode(brush.brush); });
  chrome.storage.onChanged.addListener(function() {
    processCode(brush.brush);
  }, ['enableSyntaxHighlight']);
  highlightInitialized = true;
}

if (brush) {
  chrome.extension.sendMessage(
    {
      action: 'load_script',
      file: brush.path
    }, function() {
      initializeHighlighting();
    });
}
// TODO: Sometimes we get an error when initializing highlighting in an inline frame... why?
setTimeout(function() { if (!highlightInitialized) initializeHighlighting(); }, 200);
setTimeout(function() { if (!highlightInitialized) initializeHighlighting(); }, 400);






