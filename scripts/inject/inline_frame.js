console.log("injected inline_frame.js");

//loggingDecorator('M_getPageOffsetTop');
//loggingDecorator('M_getWindowHeight');
//loggingDecorator('M_scrollIntoView');
//loggingDecorator('M_isElementVisible');
//loggingDecorator('M_getScrollTop');
//loggingDecorator('scrollTo');

// Get the parent frame's scroll position.
decorate('M_getScrollTop', function(func, win) {
    return func.call(this, win.parent);
  });

// Get the parent frame's window height.
decorate('M_getWindowHeight', function(func, win) {
    return func.call(this, win.parent);
  });

// Scroll in the parent frame (and throw out some bad calls).
decorate('scrollTo', function(func, x, y) {
    if (x == 0) {
      // Rietveld makes a bunch of assumptions about the positions of things
      // and tries to scroll to them. This doesn't work. Luckily for us, it
      // always uses 0 for the x offset when it does this.
      return;
    }
    // TODO: why is y == NaN when pressing up at the top of an inline diff?
    if (y) {
      window.parent.scrollTo(x, y);
    }
  });

// Add the offset in the parent frame.
decorateRecursive('M_getPageOffsetTop', function(func, el) {
    return func.call(this, el) + func.call(this, window.parent.document.getElementById(rb_frameId));
  });

// Rietveld calculates the position wrong (because the hook's offsetParent is no longer 'table-top'). Let's fix it.
decorate('M_HookState.prototype.updateIndicator_', function(func, tr) {
    var ret = func.call(this, tr);
    var offsetParent = this.indicator.offsetParent;
    var tableTop = document.getElementById('table-top');
    this.indicator.style.top = String(M_getPageOffsetTop(tr) - M_getPageOffsetTop(offsetParent) - 1) + 'px';
    this.indicator.style.left = String(M_getPageOffsetLeft(tr) - M_getPageOffsetLeft(offsetParent)) + 'px';
    return ret;
  });

//loggingDecorator('M_HookState.prototype.updateIndicator_');

//loggingDecorator('scrollTo');
//loggingDecorator('M_getPageOffsetTop');


