console.log("injected inline_frame.js");

loggingDecorator('M_getPageOffsetTop');
loggingDecorator('M_getWindowHeight');
loggingDecorator('M_scrollIntoView');
loggingDecorator('M_isElementVisible');
loggingDecorator('M_getScrollTop');
loggingDecorator('scrollTo');

decorate('M_getScrollTop', function(func, win) {
    return func.call(this, win.parent);
  });

decorate('M_getWindowHeight', function(func, win) {
    return func.call(this, win.parent);
  });

decorate('scrollTo', function(func, x, y) {
    window.parent.scrollTo(x, y);
  });

decorateRecursive('M_getPageOffsetTop', function(func, el) {
    return func.call(this, el) + window.parent.M_getPageOffsetTop(window.parent.document.getElementById(rb_frameId));
  });
loggingDecorator('scrollTo');
loggingDecorator('M_getPageOffsetTop');
