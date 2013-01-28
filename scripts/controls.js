function addCheckbox(container, name, setting) {
  var div = $('<div class="rb-setting"/>');
  var check = $('<input type="checkbox" class="rb-checkbox"/>');
  check.attr('disabled', 'disabled');
  function update() {
    chrome.storage.sync.get(name, function(items) {
      check.removeAttr('disabled');
      check.attr('checked', items[name]);
    });
  };
  update();
  chrome.storage.onChanged.addListener(update, name);
  check.change(function() {
    var change = {};
    change[name] = Boolean($(this).attr('checked'));
    chrome.storage.sync.set(change);
  });
  div.append(check).append($('<span/>').html(setting.description));
  container.append(div);
}

function addDropdown(container, name, setting) {
  var div = $('<div class="rb-setting"/>');
  var drop = $('<select name="' + name + '" class="rb-dropdown"/>');
  $.each(setting.values, function(_, v) {
      drop.append($('<option/>').attr('value', v).text(v));
    });

  function update() {
    chrome.storage.sync.get(name, function(items) {
      //check.removeAttr('disabled');
      //check.attr('checked', items[name]);
    });
  };
  update();
  chrome.storage.onChanged.addListener(update, name);
  drop.change(function() {
    var change = {};
    change[name] = $(this).find(':selected').text();
    console.log(change);
    chrome.storage.sync.set(change);
  });
  div.append(drop).append($('<span/>').html(setting.description));
  container.append(div);
}

function insertControls(div) {
  var settings = manifest.settings;
  $.each(settings, function (name) {
    var setting = settings[name];
    if (setting.type == 'bool') {
      addCheckbox(div, name, setting);
    }
    if (setting.type == 'dropdown') {
      addDropdown(div, name, setting);
    }
  });
}
