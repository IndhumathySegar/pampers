const KTUtil = require("./util");

// plugin setup
var KTAvatar = function (elementId, options1) {
  // Main object
  var the = this;

  // Get element object
  var element = KTUtil.get(elementId);

  if (!element) {
    return;
  }

  // Default options
  var defaultOptions = {};

  ////////////////////////////
  // ** Private Methods  ** //
  ////////////////////////////

  var Plugin = {
    /**
     * Construct
     */

    construct: function (options) {
      if (KTUtil.data(element).has("avatar")) {
        the = KTUtil.data(element).get("avatar");
      } else {
        // reset menu
        Plugin.init(options);

        // build menu
        Plugin.build();

        KTUtil.data(element).set("avatar", the);
      }

      return the;
    },

    /**
     * Init avatar
     */
    init: function (options) {
      the.element = element;
      the.events = [];

      the.input = KTUtil.find(element, 'input[type="file"]');
      the.holder = KTUtil.find(element, ".kt-avatar__holder");
      the.cancel = KTUtil.find(element, ".kt-avatar__cancel");
      the.src = KTUtil.css(the.holder, "backgroundImage");

      // merge default and user defined options
      the.options = KTUtil.deepExtend({}, defaultOptions, options);
    },

    /**
     * Build Form Wizard
     */
    build: function () {
      buildHelper.build((input, the.element, the.cancel, the.src, the.holder));
    },

    /**
     * Trigger events
     */
    eventTrigger: function (name) {
      return helper.eventTrigger1(name, the);
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
   * Attach event
   */
  the.on = function (name, handler) {
    return Plugin.addEvent(name, handler);
  };

  /**
   * Attach event that will be fired once
   */
  the.one = function (name, handler) {
    return Plugin.addEvent(name, handler, true);
  };

  // Construct plugin
  Plugin.construct.apply(the, [options1]);

  return the;
};

var helper = {
  eventTrigger1: function (name, the) {
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
var buildHelper = {
  build: function (input, element, cancel, src, holder) {
    // Handle avatar change
    KTUtil.addEvent(input, "change", function (e) {
      e.preventDefault();

      if (input && input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (item) {
          KTUtil.css(
            holder,
            "background-image",
            "url(" + item.target.result + ")"
          );
        };
        reader.readAsDataURL(input.files[0]);

        KTUtil.addClass(element, "kt-avatar--changed");
      }
    });

    // Handle avatar cancel
    KTUtil.addEvent(cancel, "click", function (e) {
      e.preventDefault();

      KTUtil.removeClass(element, "kt-avatar--changed");
      KTUtil.css(holder, "background-image", src);
      input.value = "";
    });
  },
};

// webpack support
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = KTAvatar;
}
