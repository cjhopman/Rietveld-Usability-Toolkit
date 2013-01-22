function gotoTrPos(pos, dir) {
  if (dir == undefined) dir = 0;
  dashboardState.trPos = pos;
  dashboardState.goto_(dir);
}

document.addEventListener('rb-gotoTrPos', function(e) {
  gotoTrPos(e.detail.pos, e.detail.dir);
});
