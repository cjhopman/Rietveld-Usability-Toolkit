
function tagLineNumbers() {
  $(domInspector.codelineNew())
    .add(domInspector.codelineOld())
    .filter(':not(.rb-hasLineNumber)')
    .addClass('rb-hasLineNumber')
    .each(function() {
      var html = $(this).html();
      var range = domInspector.lineNumberRange(html);
      html = html.substring(0, range[0]) +
          '<span class="rb-lineNumber">' + html.substring(range[0], range[1]) + '</span>' +
          '<span class="rb-code">' + html.substring(range[1]) + '</span>'
      $(this).html(html);
    });
  $(domInspector.codelineNew()).addClass('rb-codelineNew');
  $(domInspector.codelineOld()).addClass('rb-codelineOld');
}
tagLineNumbers();
domInspector.observeNewCodelines(tagLineNumbers);

var fixDiffSelection = false;
function updateSelectionHandler() {
  $(document).mousedown(function(ev) {
      if (ev.button == 0 && !(ev.metaKey || ev.ctrlKey || ev.shiftKey)) {
        if (fixDiffSelection) {
          domInspector.getCodelineInnerChrome().addClass('rb-codelineChrome')
          var codeline = $(ev.srcElement).closest('td').filter(domInspector.codelineAll());
          if (codeline.length == 0) return;
          var inNew = codeline.filter(domInspector.codelineOld()).length == 0;

          $('html').addClass('rb-disableSelection')
            .toggleClass('rb-disableSelectionNew', !inNew)
            .toggleClass('rb-disableSelectionOld', inNew);
        }
      }
    });
}

function updateFixDiffSelection() {
  chrome.storage.sync.get('fixDiffSelection', function(items) {
      var val = items['fixDiffSelection'];
      var old = fixDiffSelection;
      if (!val) {
        $('html').removeClass('rb-disableSelection')
          .removeClass('rb-disableSelectionNew')
          .removeClass('rb-disableSelectionOld');
      }
    });
}
updateFixDiffSelection();
chrome.storage.onChanged.addListener(function(changes, namespace) {
  updateFixDiffSelection();
}, ['fixDiffSelection']);

function highlight() {
  SyntaxHighlighter.all()
}


