/**
 * SyntaxHighlighter
 * http://alexgorbatchev.com/SyntaxHighlighter
 *
 * SyntaxHighlighter is donationware. If you are using it, please donate.
 * http://alexgorbatchev.com/SyntaxHighlighter/donate.html
 *
 * @version
 * 3.0.83 (July 02 2010)
 * 
 * @copyright
 * Copyright (C) 2004-2010 Alex Gorbatchev.
 *
 * @license
 * Dual licensed under the MIT and GPL licenses.
 */
;(function()
{
	// CommonJS
	typeof(require) != 'undefined' ? SyntaxHighlighter = require('shCore').SyntaxHighlighter : null;

	function Brush()
	{
		var keywords =
      'target_name action_name rule_name dependencies inputs outputs ' +
      'message action extension sources product_name defines cflags_cc cflags' +
      'xcode_settings coverage profiles symbols' +
      '';

		var funcs =
      'variables targets actions rules conditions target_conditions target_defaults' +
      '' +
      '';

		var special =  'includes all_dependent_settings export_dependent_settings direct_dependent_settings ' +
      'default_configuration configurations ' +
      '';

    this.getGypKeywords = function(keywords) {
      return this.getKeywords('"' + keywords.replace(/ */g, '": "'));
    }

		this.regexList = [
				{ regex: SyntaxHighlighter.regexLib.singleLinePerlComments, css: 'comments' },
				{ regex: /==/gm, 						                      	css: 'keyword' },
				{ regex: new RegExp(this.getGypKeywords(funcs), 'gmi'),		css: 'functions' },
				{ regex: new RegExp(this.getGypKeywords(keywords), 'gm'), 		css: 'keyword' },
				{ regex: new RegExp(this.getGypKeywords(special), 'gm'), 		css: 'color1' }
				];

		this.forHtmlScript(SyntaxHighlighter.regexLib.aspScriptTags);
	};

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['gyp', 'gypi'];

	SyntaxHighlighter.brushes.Gyp = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
