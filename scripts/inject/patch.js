document.addEventListener('rb-gotoTrPos', function(e) {
    var pos = e.detail.pos;
    var dir = e.detail.dir;
    if (dir == undefined) dir = 0;
    dashboardState.trPos = pos;
    dashboardState.goto_(dir);
  });

document.addEventListener('rb-nextTrPos', function(e) {
    dashboardState.gotoNext();
  });

document.addEventListener('rb-prevTrPos', function(e) {
    dashboardState.gotoPrev();
  });
