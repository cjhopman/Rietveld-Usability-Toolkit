console.log("injected inline_frame.js");

//loggingDecorator('M_getPageOffsetTop');
//loggingDecorator('M_getWindowHeight');
//loggingDecorator('M_scrollIntoView');
//loggingDecorator('M_isElementVisible');
//loggingDecorator('M_getScrollTop');
//loggingDecorator('scrollTo');

decorate('M_getScrollTop', function(func, win) {
    return func.call(this, win.parent);
  });

decorate('M_getWindowHeight', function(func, win) {
    return func.call(this, win.parent);
  });

decorate('scrollTo', function(func, x, y) {
    if (x == 0) {
      // Rietveld makes a bunch of assumptions about the positions of things
      // and tries to scroll to them. This doesn't work.
      return;
    }
    // TODO: why is y == NaN when pressing up at the top of an inline diff?
    if (y) {
      window.parent.scrollTo(x, y);
    }
  });

decorateRecursive('M_getPageOffsetTop', function(func, el) {
    return func.call(this, el) + func.call(this, window.parent.document.getElementById(rb_frameId));
  });
//loggingDecorator('scrollTo');
//loggingDecorator('M_getPageOffsetTop');
