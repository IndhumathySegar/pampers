"use strict";
var KTScrolltop = function (elementId, options1) {
  // Main object
  var the = this;

  // Get element object
  var element = KTUtil.get(elementId);

  if (!element) {
    return;
  }

  // Default options
  var defaultOptions = {
    offset: 300,
    speed: 600,
    toggleClass: "kt-scrolltop--on",
  };

  ////////////////////////////
  // ** Private Methods  ** //
  ////////////////////////////

  var Plugin = {
    /**
     * Run plugin
     * @returns {mscrolltop}
     */
    construct: function (options) {
      if (KTUtil.data(element).has("scrolltop")) {
        the = KTUtil.data(element).get("scrolltop");
      } else {
        // reset scrolltop
        Plugin.init(options);

        // build scrolltop
        Plugin.build();

        KTUtil.data(element).set("scrolltop", the);
      }

      return the;
    },

    /**
     * Handles subscrolltop click toggle
     * @returns {mscrolltop}
     */
    init: function (options) {
      the.events = [];

      // merge default and user defined options
      the.options = KTUtil.deepExtend({}, defaultOptions, options);
    },

    build: function () {
      // handle window scroll
      if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        window.addEventListener("touchend", function () {
          Plugin.handle();
        });

        window.addEventListener("touchcancel", function () {
          Plugin.handle();
        });

        window.addEventListener("touchleave", function () {
          Plugin.handle();
        });
      } else {
        window.addEventListener("scroll", function () {
          Plugin.handle();
        });
      }

      // handle button click
      KTUtil.addEvent(element, "click", Plugin.scroll);
    },

    /**
     * Handles scrolltop click scrollTop
     */
    handle: function () {
      // left intentionally
    },

    /**
     * Handles scrolltop click scrollTop
     */
    scroll: function (e) {
      e.preventDefault();

      KTUtil.scrollTop(0, the.options.speed);
    },

    /**
     * Trigger events
     */
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

  /**
   * Set default options
   */

  the.setDefaults = function (options) {
    defaultOptions = options;
  };

  /**
   * Get subscrolltop mode
   */
  the.on = function (name, handler) {
    return Plugin.addEvent(name, handler);
  };

  /**
   * Set scrolltop content
   * @returns {mscrolltop}
   */
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
  }
};

// webpack support
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = KTScrolltop;
}
