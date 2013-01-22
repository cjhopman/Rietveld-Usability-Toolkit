document.addEventListener('rb-gotoTrPos', function(e) {
    var pos = e.detail.pos;
    var old = dashboardState.trPos;
    dashboardState.trPos = pos;

    var dir = e.detail.dir;
    if (dir == undefined) dir = pos - old;
    dashboardState.goto_(dir);
  });

document.addEventListener('rb-nextTrPos', function(e) {
    dashboardState.gotoNext();
  });

document.addEventListener('rb-prevTrPos', function(e) {
    dashboardState.gotoPrev();
  });
