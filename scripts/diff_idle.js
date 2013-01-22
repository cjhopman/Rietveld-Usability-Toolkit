
function tagLineNumbers() {
  $(domInspector.codelineAll())
    .filter(':not(.rb-hasLineNumber)')
    .addClass('rb-hasLineNumber')
    .each(function() {
      var html = $(this).html();
      var range = domInspector.lineNumberRange(html);
      html = html.substring(0, range[0]) + '<span class="rb-lineNumber">' +
          html.substring(range[0], range[1]) + '</span>' + html.substring(range[1])
      console.log(html)
      $(this).html(html);
    });
}
tagLineNumbers();

var fixDiffSelection = false;
function updateSelectionHandler() {
  $(document).mousedown(function(ev) {
      $(domInspector.codelineNew()).removeClass('rb-disableSelection');
      $(domInspector.codelineOld()).removeClass('rb-disableSelection');
      domInspector.getCodelineInnerChrome().removeClass('rb-disableSelection')


      if (fixDiffSelection) {
        var codeline = $(ev.srcElement).closest('td').filter(domInspector.codelineAll());
        if (codeline.length == 0) return;
        $('.rb-lineNumber').addClass('rb-disableSelection');

        domInspector.getCodelineInnerChrome().addClass('rb-disableSelection')
        if (codeline.filter(domInspector.codelineOld()).length > 0) {
          $(domInspector.codelineNew()).addClass('rb-disableSelection');
        } else {
          $(domInspector.codelineOld()).addClass('rb-disableSelection');
        }
      }
    });
}

function updateFixDiffSelection() {
  chrome.storage.sync.get('fixDiffSelection', function(items) {
      var val = items['fixDiffSelection'];
      var old = fixDiffSelection;
      fixDiffSelection = val;
      if (val != old) updateSelectionHandler();
    });
}
updateFixDiffSelection();
chrome.storage.onChanged.addListener(function(changes, namespace) {
  updateFixDiffSelection();
}, ['fixDiffSelection']);

