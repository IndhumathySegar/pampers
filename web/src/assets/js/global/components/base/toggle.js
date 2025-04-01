"use strict";

// plugin setup
var KTToggle = function (elementId, options1) {
  // Main object
  var the = this;

  // Get element object
  var element = KTUtil.get(elementId);

  if (!element) {
    return;
  }

  // Default options
  var defaultOptions = {
    togglerState: "",
    targetState: "",
  };

  ////////////////////////////
  // ** Private Methods  ** //
  ////////////////////////////

  var Plugin = {
    /**
     * Construct
     */

    construct: function (options) {
      if (KTUtil.data(element).has("toggle")) {
        the = KTUtil.data(element).get("toggle");
      } else {
        // reset menu
        Plugin.init(options);

        // build menu
        Plugin.build();

        KTUtil.data(element).set("toggle", the);
      }

      return the;
    },

    /**
     * Handles subtoggle click toggle
     */
    init: function (options) {
      the.element = element;
      the.events = [];

      // merge default and user defined options
      the.options = KTUtil.deepExtend({}, defaultOptions, options);

      the.target = KTUtil.get(the.options.target);
      the.targetState = the.options.targetState;
      the.togglerState = the.options.togglerState;

      the.state = KTUtil.hasClasses(the.target, the.targetState) ? "on" : "off";
    },

    /**
     * Setup toggle
     */
    build: function () {
      KTUtil.addEvent(element, "mouseup", Plugin.toggle);
    },

    /**
     * Handles offcanvas click toggle
     */
    toggle: function (e) {
      Plugin.eventTrigger("beforeToggle");

      if (the.state == "off") {
        Plugin.toggleOn();
      } else {
        Plugin.toggleOff();
      }

      Plugin.eventTrigger("afterToggle");

      e.preventDefault();

      return the;
    },

    /**
     * Handles toggle click toggle
     */
    toggleOn: function () {
      Plugin.eventTrigger("beforeOn");

      KTUtil.addClass(the.target, the.targetState);

      if (the.togglerState) {
        KTUtil.addClass(element, the.togglerState);
      }

      the.state = "on";

      Plugin.eventTrigger("afterOn");

      Plugin.eventTrigger("toggle");

      return the;
    },

    /**
     * Handles toggle click toggle
     */
    toggleOff: function () {
      Plugin.eventTrigger("beforeOff");

      KTUtil.removeClass(the.target, the.targetState);

      if (the.togglerState) {
        KTUtil.removeClass(element, the.togglerState);
      }

      the.state = "off";

      Plugin.eventTrigger("afterOff");

      Plugin.eventTrigger("toggle");

      return the;
    },

    /**
     * Trigger events
     */
    eventTrigger: function (name) {
      return helper.eventTriggerHelper(name, the);
    },

    addEvent: function (name, handler, one) {
      the.events.push({
        name: name,
        handler: handler,
        one: one,
        fired: false,
      });

      return the;
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
   * Get toggle state
   */
  the.getState = function () {
    return the.state;
  };

  /**
   * Toggle
   */
  the.toggle = function () {
    return Plugin.toggle();
  };

  /**
   * Toggle on
   */
  the.toggleOn = function () {
    return Plugin.toggleOn();
  };

  /**
   * Toggle off
   */
  the.toggleOff = function () {
    return Plugin.toggleOff();
  };

  /**
   * Attach event
   * @returns {KTToggle}
   */
  the.on = function (name, handler) {
    return Plugin.addEvent(name, handler);
  };

  /**
   * Attach event that will be fired once
   * @returns {KTToggle}
   */
  the.one = function (name, handler) {
    return Plugin.addEvent(name, handler, true);
  };

  // Construct plugin
  Plugin.construct.apply(the, [options1]);

  return the;
};
var helper = {
  eventTriggerHelper: function (name, the) {
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
};

// webpack support
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = KTToggle;
}
