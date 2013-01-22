help = $('<div id="rb-help"/>');
settings = $('<div id="rb-settings" style="display:table; margin:auto"/>')
header = $('<hr/><div style="font-size: large; text-align: center"> Rietveld Usability Toolkit <span style="font-size: small; vertical-align: middle">- by cjhopman</span></div><hr/>')
help.append(header);
help.append(settings);
insertControls(settings);
settings.find('.rb-setting').click(function(ev) { ev.stopPropagation(); });

$('#help').append(help);

var helpScale = 1.0;
function applyHelpScale(newScale) {
  var yTranslate = $('#help').outerHeight() * (1 - newScale) / 1.3;
  var transform = 'scale(' + newScale + ') translate(0px, -' + yTranslate + 'px)';
  $('#help').css('-webkit-transform', transform);
  helpScale = newScale;
}
function smaller() {
  applyHelpScale(helpScale * 0.9);
}
function resizeHelp() {
  var newScale = window.innerHeight * 0.9 / $('#help').outerHeight();
  newScale = Math.min(Math.max(newScale, 0.5), 1.0);
  applyHelpScale(newScale);
}
resizeHelp();

$(window).resize(resizeHelp);

