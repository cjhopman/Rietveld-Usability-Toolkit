var TAG = "beautifier";

var settings = {
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
      "description": "Automatically set the column width in diff views"
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
      "default": true,
      "description": "Change font used for code lines."
    },
    "colorBlindMode": {
      "type": "bool",
      "default": true,
      "description": "Make diff color coding more colorblind friendly."
    },
    "changeReplaceColor": {
      "type": "bool",
      "default": true,
      "description": "Use a different color for replace sections."
    }
  }
}
