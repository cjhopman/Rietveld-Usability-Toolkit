var codelineSelector = '\
    .olddark, .newdark, .oldreplace, .olddelete, .oldinsert, .oldequal, .oldblank, \
    .oldlight, .newlight, .oldreplace1, .newreplace1, \
    .newreplace, .newdelete, .newinsert, .newequal, .newblank, \
    .oldmove, .oldchangemove, .oldchangemove1, .oldmove_out, .oldchangemove_out, \
    .newmove, .newchangemove, .newchangemove1, \
    .udiffadd, .udiffremove, .udiff, .debug-info';

$(document.documentElement).append($('<style id="codelineStyle"/>'))

function updateCodelineFont() {
  chrome.storage.sync.get({ 'fontEnabled': true, 'font': 'Inconsolata' } , function(items) {
    var html = '';
    if (items['fontEnabled']) {
      html = codelineSelector + '{ font-family: ' + items['font'] + ', monospace !important; }';
    }
    $('#codelineStyle').html(html);
  });
}
updateCodelineFont();
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if ('fontEnabled' in changes || 'font' in changes) {
    updateCodelineFont();
  }
});

