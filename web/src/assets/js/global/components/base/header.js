"use strict";
var KTHeader = function (elementId, options1) {
  // Main object
  var the = this;

  // Get element object
  var element = KTUtil.get(elementId);
  var body = KTUtil.get("body");

  if (element === undefined) {
    return;
  }

  // Default options
  var defaultOptions = {
    classic: false,
    offset: {
      mobile: 150,
      desktop: 200,
    },
    minimize: {
      mobile: false,
      desktop: false,
    },
  };

  ////////////////////////////
  // ** Private Methods  ** //
  ////////////////////////////

  var Plugin = {
    /**
     * Run plugin
     * @returns {KTHeader}
     */
    construct: function (options) {
      if (KTUtil.data(element).has("header")) {
        the = KTUtil.data(element).get("header");
      } else {
        // reset header
        Plugin.init(options);

        // build header
        Plugin.build();

        KTUtil.data(element).set("header", the);
      }

      return the;
    },

    /**
     * Handles subheader click toggle
     * @returns {KTHeader}
     */
    init: function (options) {
      the.events = [];

      // merge default and user defined options
      the.options = KTUtil.deepExtend({}, defaultOptions, options);
    },

    /**
     * Reset header
     * @returns {KTHeader}
     */
    build: function () {
      helper.buildHelper(the, body);
    },

    /**
     * Trigger events
     */
    eventTrigger: function (name, args) {
      return helper.eventTrigger1(name, args, the);
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
   * Register event
   */
  the.on = function (name, handler) {
    return Plugin.addEvent(name, handler);
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
  buildHelper: function (the, body) {
    var eventTriggerState = true;
    KTUtil.getDocumentHeight();

    if (
      the.options.minimize.mobile === false &&
      the.options.minimize.desktop === false
    ) {
      return;
    }

    window.addEventListener("scroll", function () {
      var offset = 0,
        on,
        off,
        st;

      if (KTUtil.isInResponsiveRange("desktop")) {
        offset = the.options.offset.desktop;
        on = the.options.minimize.desktop.on;
        off = the.options.minimize.desktop.off;
      } else if (KTUtil.isInResponsiveRange("tablet-and-mobile")) {
        offset = the.options.offset.mobile;
        on = the.options.minimize.mobile.on;
        off = the.options.minimize.mobile.off;
      }

      st = KTUtil.getScrollTop();

      if (
        (KTUtil.isInResponsiveRange("tablet-and-mobile") &&
          the.options.classic &&
          the.options.classic.mobile) ||
        (KTUtil.isInResponsiveRange("desktop") &&
          the.options.classic &&
          the.options.classic.desktop)
      ) {
        eventTriggerState = this.firstOffsetCondition(
          st,
          offset,
          eventTriggerState,
          body,
          on,
          off,
          the
        );
      } else {
        this.secondOffsetCondition(
          st,
          offset,
          eventTriggerState,
          body,
          on,
          off,
          the
        );
      }
    });
  },
  firstOffsetCondition: function (
    st,
    offset,
    eventTriggerState,
    body,
    on,
    off,
    the
  ) {
    if (st > offset) {
      // down scroll mode
      KTUtil.addClass(body, on);
      KTUtil.removeClass(body, off);

      if (eventTriggerState) {
        KTHeader.Plugin.eventTrigger("minimizeOn", the);
        eventTriggerState = false;
      }
    } else {
      // back scroll mode
      KTUtil.addClass(body, off);
      KTUtil.removeClass(body, on);

      if (!eventTriggerState) {
        KTHeader.Plugin.eventTrigger("minimizeOff", the);
        eventTriggerState = true;
      }
    }
    return eventTriggerState;
  },
  secondOffsetCondition: function (
    st,
    offset,
    eventTriggerState,
    body,
    on,
    off,
    the
  ) {
    if (st > offset && lastScrollTop < st) {
      // down scroll mode
      KTUtil.addClass(body, on);
      KTUtil.removeClass(body, off);

      if (eventTriggerState) {
        KTHeader.Plugin.eventTrigger("minimizeOn", the);
        eventTriggerState = false;
      }
    } else {
      // back scroll mode
      KTUtil.addClass(body, off);
      KTUtil.removeClass(body, on);

      if (!eventTriggerState) {
        KTHeader.Plugin.eventTrigger("minimizeOff", the);
        eventTriggerState = true;
      }
    }
    return eventTriggerState;
  },
};

// webpack support
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = KTHeader;
}
