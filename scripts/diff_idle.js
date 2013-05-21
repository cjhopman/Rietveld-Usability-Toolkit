function extractLineNumber(node) {
  var childList = node.childNodes;
  var left = [];
  var right = [];
  var i = 0;
  for (; i < childList.length; i++) {
    var child = childList[i];
    if (child.nodeType == 3) {
      var text = child.nodeValue;
      var m = text.match(' *[0-9]+');
      if (m) {
        left.push(document.createTextNode(m[0]));
        right.push(document.createTextNode(text.substr(m[0].length)));
        break;
      } else {
        left.push(document.createTextNode(text));
      }
    } else {
      var els = extractLineNumber(child);
      if (els[0]) {
        var leftChild = child.cloneNode(false);
        for (var j = 0; j < els[0].length; j++) {
          leftChild.appendChild(els[0][j]);
        }
        var rightChild = child.cloneNode(false);
        for (var j = 0; j < els[1].length; j++) {
          leftChild.appendChild(els[1][j]);
        }
        left.push(leftChild);
        right.push(rightChild);
        break;
      } else {
        left.push(child.cloneNode(true));
      }
    }
  }
  i++;
  for (; i < childList.length; i++) {
    var child = childList[i];
    right.push(child.cloneNode(true));
  }
  return [left, right];
}

function splitCell(self, cellClasses, codeClass) {
  var firstChild = self.firstChild;
  var els = extractLineNumber(self);
  var newCell = self.cloneNode(false);
  if (els[0].length > 0) {
    var lineSpan = document.createElement('span');
    lineSpan.classList.add('rb-lineNumber');
    var lineAnchor = document.createElement('a');
    lineAnchor.classList.add('rb-lineNumberCsLink');
    for (var i = 0; i < els[0].length; i++)
      lineAnchor.appendChild(els[0][i]);
    lineSpan.appendChild(lineAnchor);
    var row = $(self).closest('td');
    var line = parseInt(row.attr('id').substring(7));
    var filename = domInspector.filePathFromDiffUrl(window.location.href);
    var baseurl = domInspector.baseUrlOnDiffPage();
    var cs_link = getCodesearchUrl(window.location.hostname, baseurl, filename, line);
    if (cs_link) {
      lineAnchor.href = cs_link;
      lineAnchor.classList.add('rb-lineNumberCsLinkEnabled');
    } else {
      lineAnchor.classList.add('rb-lineNumberCsLinkDisabled');
    }
    newCell.appendChild(lineSpan);
  }
  if (els[1]) {
    codeSpan = document.createElement('span');
    codeSpan.classList.add('rb-code', codeClass);
    for (var i = 0; i < els[1].length; i++)
      codeSpan.appendChild(els[1][i]);
    newCell.appendChild(codeSpan);
  }
  for (var i = 0; i < cellClasses.length; i++) {
    newCell.classList.add(cellClasses[i]);
  }
  self.parentNode.replaceChild(newCell, self);
}

function tagLineNumbers() {
  codelinesNew = document.querySelectorAll(domInspector.codelineNew(':not(.rb-hasLineNumber)'));
  for (var i = 0; i < codelinesNew.length; i++) {
    var line = codelinesNew[i];
    splitCell(line, ['rb-hasLineNumber', 'rb-codelineNew'], 'rb-innerCodeNew');
  }

  codelinesOld = document.querySelectorAll(domInspector.codelineOld(':not(.rb-hasLineNumber)'));
  for (var i = 0; i < codelinesOld.length; i++) {
    var line = codelinesOld[i];
    splitCell(line, ['rb-hasLineNumber', 'rb-codelineOld'], 'rb-innerCodeNew');
  }
}
timingDecorator('tagLineNumbers');
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

