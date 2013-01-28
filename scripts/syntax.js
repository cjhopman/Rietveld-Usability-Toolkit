var codeLines = [];
var brush = new SyntaxHighlighter.brushes.Java();

addStyleLink('rb-syntaxTheme');

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
      code: self.html(),
      line: parseInt(row.attr('id').substring(5)),
      column: column,
      matches: []
    });
  };
}

function findMatches(code, brush) {
  var matches = [];
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
  matches = matches.filter(function(v, idx) {
      if (idx == 0) return true;
      var prev = matches[idx - 1];
      return prev.index + prev.length < v.index;
    });
  return matches;
}


function splitToBlocks(arr, breaks) {
  var blocks = [];
  var nextBreakIdx = 0;
  var nextBreak = breaks[nextBreakIdx++];
  $.each(arr, function(_, line) {
      if (line.column > nextBreak.column || line.line > nextBreak.line) {
        blocks.push({
            rows: [],
            code: '',
            map: []
          });
        nextBreak = breaks[nextBreakIdx++];
      }
      var block = blocks[blocks.length - 1];
      block.rows.push(line);
      block.code += line.code
        .replace(/\n/g, ' ')
        .replace(/<span class="oldlight">/g, '                       ')
        .replace(/<span class="newlight">/g, '                       ')
        .replace(/<span class="olddark">/g, '                      ')
        .replace(/<span class="newdark">/g, '                      ')
        .replace(/<\/span>/g, '       ')
        + '\n';
      block.map.push(block.code.length)
      lastLine = line;
    });
  return blocks;
}

var blockMatches;
function processCode() {
  var start = new Date().getTime();
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

  var breaks = domInspector.getCodeBreaks().concat([Infinity]);
  breaks = [{ column: -1, line: -1 }]
    .concat($.map(breaks, function(v) { return { column: 0, line: v }; }))
    .concat($.map(breaks, function(v) { return { column: 1, line: v }; }));

  var codeBlocks = splitToBlocks(codeLines, breaks);
  blockMatches = $.each(codeBlocks, function(_, bl) { bl.matches = findMatches(bl.code, brush) });

  $.each(blockMatches, function(_, block) {
      $.each(block.matches, function(_, match) {
          rowIdx = block.map.lowerBound(match.index + 1);
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
        });
      $.each(block.rows, function(_, row) {
          var html = row.code;
          var position = 0;
          row.matches = row.matches.filter(function(match) {
              if (position > match.rowIndex) return false;
              position = match.rowIndex + match.length;
              return true;
            });
          $.each(row.matches.slice().reverse(), function(_, match) {
              html = html.substring(0, match.rowIndex)
                + '<span class="' + match.css + '">' + html.substring(match.rowIndex, match.rowIndex + match.length) + '</span>'
                + html.substring(match.rowIndex + match.length);
            });
          row.self.html(html);
        });
    });

  $(domInspector.codelineAll()).addClass('syntaxhighlighter');
  var end = new Date().getTime();
}

processCode();
domInspector.observeNewCodelines(processCode);






