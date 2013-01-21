help = $('<div id="rb-help"/>');
settings = $('<div id="rb-settings" style="display:table; margin:auto"/>')
header = $('<hr/><div style="font-size: large; text-align: center"> Rietveld Usability Toolkit <span style="font-size: small; vertical-align: middle">- by cjhopman</span></div><hr/>')
help.append(header);
help.append(settings);
insertControls(settings);
settings.find('.rb-checkbox').click(function(ev) { ev.stopPropagation(); });

$('#help').append(help);

