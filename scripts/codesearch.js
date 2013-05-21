var cs_mappings = [
  [['chromiumcodereview.appspot.com', 'codereview.chromium.org'], {
    'svn://svn.chromium.org/chrome/trunk/src': 'https://code.google.com/p/chromium/codesearch#chromium/src/{filename}&l={line}',
    'svn://svn.chromium.org/blink/trunk': 'https://code.google.com/p/chromium/codesearch#chromium/src/third_party/WebKit/{filename}&l={line}'
  }],
];

function getCodesearchUrl(rietveld_url, baseurl, filename, line) {
  var cs_instance;
  for (var i = 0; i < cs_mappings.length; i++) {
    for (var j = 0; j < cs_mappings[i][0].length; j++) {
      if (rietveld_url.match(cs_mappings[i][0][j])) {
        cs_instance = cs_mappings[i][1];
      }
    }
  }
  if (!cs_instance) return;
  for (var baseurl_pattern in cs_instance) {
    if (baseurl.match(baseurl_pattern)) {
      var pattern = cs_instance[baseurl_pattern];
      if (pattern) {
        return pattern.kwformat({ 'filename': filename, 'line': line });
      }
    }
  }
}

