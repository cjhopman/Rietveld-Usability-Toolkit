function addCheckbox(container, name, setting) {
  var div = $('<div class="br-setting"/>');
  var check = $('<input type="checkbox"/>');
  check.attr('disabled', 'disabled');
  chrome.storage.sync.get(name, function(items) {
    check.removeAttr('disabled');
    check.attr('checked', items[name]);
    check.change(function() {
      var change = {};
      change[name] = Boolean($(this).attr('checked'));
      chrome.storage.sync.set(change);
    });
  });
  div.append(check).append(document.createTextNode(setting.description));
  container.append(div);
}

function insertControls(div) {
  var settings = manifest.settings;
  $.each(settings, function (name) {
    var setting = settings[name];
    if (setting.type == 'bool') {
      addCheckbox(div, name, setting);
    }
  });
}

$(window).load(function() {
  insertControls($('#controls'))
});
