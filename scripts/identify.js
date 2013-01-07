var domInspector = null;

var rietveldInstances = [
  "codereview.appspot.com",
  "chromiumcodereview.appspot.com",
  "chromereviews.googleplex.com",
  "codereview.chromium.org"
];

function RietveldInspector() { };

RietveldInspector.prototype.isDiff = function() {
  return Boolean(document.URL.match(/.*\/diff2?\//));
}

RietveldInspector.prototype.isPatch = function() {
  return $('.issue-details').length > 0;
}
RietveldInspector.prototype.codelineAll = function() {  return '\
    .olddark, .newdark, .oldreplace, .olddelete, .oldinsert, .oldequal, .oldblank, \
    .oldlight, .newlight, .oldreplace1, .newreplace1, \
    .newreplace, .newdelete, .newinsert, .newequal, .newblank, \
    .oldmove, .oldchangemove, .oldchangemove1, .oldmove_out, .oldchangemove_out, \
    .newmove, .newchangemove, .newchangemove1, \
    .udiffadd, .udiffremove, .udiff, .debug-info';
}
RietveldInspector.prototype.codelineLight = function() { return '.oldlight, .newlight'; }
RietveldInspector.prototype.codelineDark = function() { return '.olddark, .newdark'; }
RietveldInspector.prototype.codelineOldReplace = function() { return '.oldreplace, .oldreplace1'; }
RietveldInspector.prototype.codelineNewReplace = function() { return '.newreplace, .newreplace1'; }
RietveldInspector.prototype.codelineOldDelete = function() { return '.olddelete'; }
RietveldInspector.prototype.codelineNewInsert = function() { return '.newinsert'; }


function isUrlRietveld(url) {
  for (var i in rietveldInstances) {
    if (url.search(rietveldInstances[i])) return true;
  }
}

if (isUrlRietveld(document.URL)) {
  domInspector = new RietveldInspector();
} else if (false) {

}




