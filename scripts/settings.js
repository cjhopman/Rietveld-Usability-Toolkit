var TAG = "beautifier";

var manifest = {
  "settings": {
    "enableInlineDiffs": {
      "type": "bool",
      "default": true,
      "description": "Enable inline diffs."
    },
    "createViewAllButtons": {
      "type": "bool",
      "default": true,
      "description": "Create buttons to open all diffs.",
      "requires": "enableInlineDiffs"
    },
    "rewriteUnifiedLinks": {
      "type": "bool",
      "default": true,
      "description": "Rewrite unified diff links to side-by-side links."
    },
    "hideBaseUrl": {
      "type": "bool",
      "default": true,
      "description": "Add breakpoints to Base URL."
    },
    "displayProgress": {
      "type": "bool",
      "default": true,
      "description": "Display review progress in the single patch view."
    },
    "enableAnimations": {
      "type": "bool",
      "default": true,
      "description": "Animate showing/hiding inline diffs."
    },
    "autoSetColumnWidth": {
      "type": "bool",
      "default": true,
      "description": "Automatically set the column width in inline diff views."
    },
    "columnWidthMap": {
      "type": "dict",
      "default": { "java": 100, "gyp": 100, "gypi": 100, "xml": 100 },
      "description": "How many columns for each filetype."
    },
    "codeFont": {
      "type": "string",
      "default": "Inconsolata",
      "description": "Font for code lines."
    },
    "hosts": {
      "type": "list",
      "default": [
        "codereview.chromium.org",
        "breakpad.appspot.com",
        "chromiumcodereview.appspot.com",
        "chromereviews.googleplex.com",
        "codereview.chromium.org",
        "webrtc-codereview.appspot.com"
      ],
      "description": "Rietveld URLs to beautify"
    },
    "codeFontEnabled": {
      "type": "bool",
      "default": false,
      "description": "Change font used for code lines."
    },
    "colorBlindMode": {
      "type": "bool",
      "default": false,
      "description": "Make diff color coding more colorblind friendly (maybe)."
    },
    "lineNumberColorEnabled": {
      "type": "bool",
      "default": true,
      "description": "Lighten up the line numbers."
    },
    "changeReplaceColor": {
      "type": "bool",
      "default": true,
      "description": "Use a different color for replace sections."
    },
    "loadLimit": {
      "type": "number",
      "default": 2,
      "description": "Maximum simultaneous frame loads."
    },
    "queueThrottle": {
      "type": "number",
      "default": 250,
      "description": "Delay between successive frame loads."
    },
    "fixDiffSelection": {
      "type": "bool",
      "default": false,
      "description": "Fix selection/copy in diff views. This does not work (for copy), see <a href=https://bugs.webkit.org/show_bug.cgi?id=80159> this webkit bug.</a>"
    },
    "enableSyntaxHighlight": {
      "type" : "bool",
      "default": true,
      "description": "Enable syntax highlighting."
    },
    "syntaxTheme": {
      "type": "dropdown",
      "default": "Default",
      "description": "Syntax highlighting theme.",
      "values": [
        "Default",
        "Django",
        "Eclipse",
        "Emacs",
        "FadeToGrey",
        "MDUltra",
        "Midnight",
        "RDark"
          ]
    },
    "codeFontSizeEnabled": {
      "type": "bool",
      "default": false,
      "description": "Change font size used for code lines."
    },
    "codeFontSize": {
      "type": "dropdown",
      "default": "12px",
      "description": "Font for code lines.",
      "values": [
        " 8px",
        " 9px",
        "10px",
        "11px",
        "12px",
        "13px",
        "14px",
        "15px",
        "16px",
        "17px",
        "18px",
          ]
    },
  }
}
