"use strict";
var KTOffcanvas = function (elementId, options1) {
  // Main object
  var the = this;

  // Get element object
  var element = KTUtil.get(elementId);
  var body = KTUtil.get("body");

  if (!element) {
    return;
  }

  // Default options
  var defaultOptions = {};

  ////////////////////////////
  // ** Private Methods  ** //
  ////////////////////////////

  var Plugin = {
    construct: function (options) {
      if (KTUtil.data(element).has("offcanvas")) {
        the = KTUtil.data(element).get("offcanvas");
      } else {
        // reset offcanvas
        Plugin.init(options);

        // build offcanvas
        Plugin.build();

        KTUtil.data(element).set("offcanvas", the);
      }

      return the;
    },

    init: function (options) {
      the.events = [];

      // merge default and user defined options
      the.options = KTUtil.deepExtend({}, defaultOptions, options);

      the.classBase = the.options.baseClass;
      the.classShown = the.classBase + "--on";
      the.classOverlay = the.classBase + "-overlay";

      the.state = KTUtil.hasClass(element, the.classShown) ? "shown" : "hidden";
    },

    build: function () {
      helper.buildHelper(the, Plugin);
    },

    isShown: function (target) {
      return the.state == "shown" ? true : false;
    },

    toggle: function () {
      helper.toggleNew();
    },

    show: function (target) {
      helper.showNew(target, body, the);
    },

    hide: function (target) {
      helper.hideNew(target, the);
    },

    togglerClass: function (target, mode) {
      helper.togglerClassNew(target, mode, the);
    },

    eventTrigger: function (name, args) {
      helper.eventTrigger1(name, args, the);
    },

    addEvent: function (name, handler, one) {
      the.events.push({
        name: name,
        handler: handler,
        one: one,
        fired: false,
      });
    },
  };

  //////////////////////////
  // ** Public Methods ** //
  //////////////////////////
  the.setDefaults = function (options) {
    defaultOptions = options;
  };

  the.isShown = function () {
    return Plugin.isShown();
  };

  the.hide = function () {
    return Plugin.hide();
  };

  the.show = function () {
    return Plugin.show();
  };

  the.on = function (name, handler) {
    return Plugin.addEvent(name, handler);
  };

  the.one = function (name, handler) {
    return Plugin.addEvent(name, handler, true);
  };

  ///////////////////////////////
  // ** Plugin Construction ** //
  ///////////////////////////////

  // Run plugin
  Plugin.construct.apply(the, [options1]);

  // Return plugin instance
  return the;
};
var helper = {
  eventTrigger1: function (name, args, the) {
    var events = the.events;
    for (var i in events) {
      var event = events[i];
      if (event.name == name) {
        if (event.one) {
          if (!event.fired) {
            the.events[i].fired = true;
            return event.handler.call(this, the);
          }
        } else {
          return event.handler.call(this, the);
        }
      }
    }
  },
  performEvent: function (the) {
    if (the.options.toggleBy[0].target) {
      for (var i in the.options.toggleBy) {
        KTUtil.addEvent(the.options.toggleBy[i].target, "click", function (e) {
          e.preventDefault();
          KTOffcanvas.Plugin.toggle();
        });
      }
    } else {
      for (var j in the.options.toggleBy) {
        KTUtil.addEvent(the.options.toggleBy[j], "click", function (e) {
          e.preventDefault();
          KTOffcanvas.Plugin.toggle();
        });
      }
    }
  },
  buildHelper: function (the) {
    // offcanvas toggle
    if (the.options.toggleBy) {
      if (typeof the.options.toggleBy === "string") {
        KTUtil.addEvent(the.options.toggleBy, "click", function (e) {
          e.preventDefault();
          KTOffcanvas.Plugin.toggle();
        });
      } else if (the.options.toggleBy && the.options.toggleBy[0]) {
        this.performEvent(the);
      } else if (the.options.toggleBy && the.options.toggleBy.target) {
        KTUtil.addEvent(the.options.toggleBy.target, "click", function (e) {
          e.preventDefault();
          KTOffcanvas.Plugin.toggle();
        });
      }
    }

    // offcanvas close
    var closeBy = KTUtil.get(the.options.closeBy);
    if (closeBy) {
      KTUtil.addEvent(closeBy, "click", function (e) {
        e.preventDefault();
        KTOffcanvas.Plugin.hide();
      });
    }
  },
  toggleNew: function (the) {
    this.eventTrigger1("toggle", the.events, the);

    if (the.state == "shown") {
      KTOffcanvas.Plugin.hide(this);
    } else {
      KTOffcanvas.Plugin.show(this);
    }
  },
  showNew: function (target, body, the) {
    if (the.state == "shown") {
      return;
    }

    KTOffcanvas.Plugin.eventTrigger("beforeShow");

    KTOffcanvas.Plugin.togglerClass(target, "show");

    // Offcanvas panel
    KTUtil.addClass(body, the.classShown);
    KTUtil.addClass(element, the.classShown);

    the.state = "shown";

    if (the.options.overlay) {
      the.overlay = KTUtil.insertAfter(document.createElement("DIV"), element);
      KTUtil.addClass(the.overlay, the.classOverlay);
      KTUtil.addEvent(the.overlay, "click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        KTOffcanvas.Plugin.hide(target);
      });
    }

    KTOffcanvas.Plugin.eventTrigger("afterShow");
  },
  hideNew: function (target, the) {
    if (the.state == "hidden") {
      return;
    }

    KTOffcanvas.Plugin.eventTrigger("beforeHide");

    KTOffcanvas.Plugin.togglerClass(target, "hide");

    KTUtil.removeClass(body, the.classShown);
    KTUtil.removeClass(element, the.classShown);

    the.state = "hidden";

    if (the.options.overlay && the.overlay) {
      KTUtil.remove(the.overlay);
    }

    KTOffcanvas.Plugin.eventTrigger("afterHide");
  },
  togglerClassNew: function (target, mode, the) {
    // Toggler
    var id = KTUtil.attr(target, "id");
    var toggleBy;

    if (
      the.options.toggleBy &&
      the.options.toggleBy[0] &&
      the.options.toggleBy[0].target
    ) {
      for (var i in the.options.toggleBy) {
        if (the.options.toggleBy[i].target === id) {
          toggleBy = the.options.toggleBy[i];
        }
      }
    } else if (the.options.toggleBy && the.options.toggleBy.target) {
      toggleBy = the.options.toggleBy;
    }

    if (toggleBy) {
      var el = KTUtil.get(toggleBy.target);

      if (mode === "show") {
        KTUtil.addClass(el, toggleBy.state);
      }

      if (mode === "hide") {
        KTUtil.removeClass(el, toggleBy.state);
      }
    }
  },
};

// webpack support
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = KTOffcanvas;
}
