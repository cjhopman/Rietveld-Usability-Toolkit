var TAG = "beautifier";

var manifest = {
  "settings": {
    "enableInlineDiffs": {
      "type": "bool",
      "default": true,
      "description": "Enable inline diffs."
    },
    "rewriteUnifiedLinks": {
      "type": "bool",
      "default": true,
      "description": "Rewrite unified diff links to side-by-side links."
    },
    "hideBaseUrl": {
      "type": "bool",
      "default": true,
      "description": "Hide base URL section."
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
    "codeFontEnabled": {
      "type": "bool",
      "default": false,
      "description": "Change font used for code lines."
    },
    "colorBlindMode": {
      "type": "bool",
      "default": false,
      "description": "Make diff color coding more (maybe?) colorblind friendly."
    },
    "changeReplaceColor": {
      "type": "bool",
      "default": true,
      "description": "Use a different color for replace sections."
    }
  }
}
