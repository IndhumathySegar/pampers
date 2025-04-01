// plugin setup
var KTWizard = function (elementId, options1) {
  // Main object
  var the = this;

  // Get element object
  var element = KTUtil.get(elementId);

  if (!element) {
    return;
  }

  // Default options
  var defaultOptions = {
    startStep: 1,
    clickableSteps: true,
  };

  ////////////////////////////
  // ** Private Methods  ** //
  ////////////////////////////

  var Plugin = {
    /**
     * Construct
     */

    construct: function (options) {
      console.log(KTUtil.data(element).has("wizard"), "KTUtil.data(element).has(wizard)")
      if (KTUtil.data(element).has("wizard")) {
        the = KTUtil.data(element).get("wizard");
      } else {
        // reset menu
        Plugin.init(options);

        // build menu
        Plugin.build();

        KTUtil.data(element).set("wizard", the);
      }

      return the;
    },

    /**
     * Init wizard
     */
    init: function (options) {
      the.element = element;
      the.events = [];

      // merge default and user defined options
      the.options = KTUtil.deepExtend({}, defaultOptions, options);

      // Elements
      the.steps = KTUtil.findAll(element, '[data-ktwizard-type="step"]');

      the.btnSubmit = KTUtil.find(
        element,
        '[data-ktwizard-type="action-submit"]'
      );
      the.btnNext = KTUtil.find(element, '[data-ktwizard-type="action-next"]');
      the.btnPrev = KTUtil.find(element, '[data-ktwizard-type="action-prev"]');
      the.btnLast = KTUtil.find(element, '[data-ktwizard-type="action-last"]');
      the.btnFirst = KTUtil.find(
        element,
        '[data-ktwizard-type="action-first"]'
      );

      // Variables
      the.events = [];
      the.currentStep = 1;
      the.stopped = false;
      the.totalSteps = the.steps.length;

      // Init current step
      if (the.options.startStep > 1) {
        Plugin.goTo(the.options.startStep);
      }

      // Init UI
      Plugin.updateUI();
    },

    /**
     * Build Form Wizard
     */
    build: function () {
      // Next button event handler
      KTUtil.addEvent(the.btnNext, "click", function (e) {
        e.preventDefault();
        Plugin.goTo(Plugin.getNextStep(), true);
      });

      // Prev button event handler
      KTUtil.addEvent(the.btnPrev, "click", function (e) {
        e.preventDefault();
        Plugin.goTo(Plugin.getPrevStep(), true);
      });

      // First button event handler
      KTUtil.addEvent(the.btnFirst, "click", function (e) {
        e.preventDefault();
        Plugin.goTo(1, true);
      });

      // Last button event handler
      KTUtil.addEvent(the.btnLast, "click", function (e) {
        e.preventDefault();
        Plugin.goTo(the.totalSteps, true);
      });

      helper.buildHelper(the, Plugin);
    },

    /**
     * Handles wizard click wizard
     */
    goTo: function (number, eventHandle) {

      // Skip if this step is already shown
      if (number === the.currentStep || number > the.totalSteps || number < 0) {
        return;
      }

      // Validate step number
      if (number) {
        number = parseInt(number);
      } else {
        number = Plugin.getNextStep();
      }

      return helper.goToHelper(number, eventHandle, the);
    },

    /**
     * Cancel
     */
    stop: function () {
      the.stopped = true;
    },

    /**
     * Resume
     */
    start: function () {
      the.stopped = false;
    },

    /**
     * Check last step
     */
    isLastStep: function () {
      return the.currentStep === the.totalSteps;
    },

    /**
     * Check first step
     */
    isFirstStep: function () {
      return the.currentStep === 1;
    },

    /**
     * Check between step
     */
    isBetweenStep: function () {
      return Plugin.isLastStep() === false && Plugin.isFirstStep() === false;
    },

    /**
     * Go to the first step
     */
    updateUI: function () {
      var stepType = "";
      var index = the.currentStep - 1;

      helper.updateUIHelper(index, stepType, element, Plugin);
    },

    /**
     * Get next step
     */
    getNextStep: function () {
      return getNextStepHelper(the.totalSteps, the.currentStep);
    },

    /**
     * Get prev step
     */
    getPrevStep: function () {
      return helper.getPrevStepHelper(the.currentStep);
    },

    /**
     * Trigger events
     */
    eventTrigger: function (name, nested) {
      return helper.eventTriggerHelper(the, name);
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
   * Go to the next step
   */
  the.goNext = function (eventHandle) {
    return Plugin.goTo(Plugin.getNextStep(), eventHandle);
  };

  /**
   * Go to the prev step
   */
  the.goPrev = function (eventHandle) {
    return Plugin.goTo(Plugin.getPrevStep(), eventHandle);
  };

  /**
   * Go to the last step
   */
  the.goLast = function (eventHandle) {
    return Plugin.goTo(the.totalSteps, eventHandle);
  };

  /**
   * Go to the first step
   */
  the.goFirst = function (eventHandle) {
    return Plugin.goTo(1, eventHandle);
  };

  /**
   * Go to a step
   */
  the.goTo = function (number, eventHandle) {
    return Plugin.goTo(number, eventHandle);
  };

  /**
   * Cancel step
   */
  the.stop = function () {
    return Plugin.stop();
  };

  /**
   * Resume step
   */
  the.start = function () {
    return Plugin.start();
  };

  /**
   * Get current step number
   */
  the.getStep = function () {
    return the.currentStep;
  };

  /**
   * Check last step
   */
  the.isLastStep = function () {
    return Plugin.isLastStep();
  };

  /**
   * Check first step
   */
  the.isFirstStep = function () {
    return Plugin.isFirstStep();
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
  updateUIHelper: function (index, stepType, element, Plugin) {

    if (Plugin.isLastStep()) {
      stepType = "last";
    } else if (Plugin.isFirstStep()) {
      stepType = "first";
    } else {
      stepType = "between";
    }

    KTUtil.attr(element, "data-ktwizard-state", stepType);

    // Steps
    var steps = KTUtil.findAll(the.element, '[data-ktwizard-type="step"]');
    this.stepsHelper(steps, index);

    // Steps Info
    var stepsInfo = KTUtil.findAll(
      element,
      '[data-ktwizard-type="step-info"]'
    );
    this.stepInfoHelper(stepsInfo);

    // Steps Content
    var stepsContent = KTUtil.findAll(
      element,
      '[data-ktwizard-type="step-content"]'
    );
    this.stepInfoHelper(stepsContent);
  },
  stepsHelper: function (steps, index) {
    if (steps && steps.length > 0) {
      for (var i = 0, len = steps.length; i < len; i++) {
        if (i == index) {
          KTUtil.attr(steps[i], "data-ktwizard-state", "current");
        } else {
          if (i < index) {
            KTUtil.attr(steps[i], "data-ktwizard-state", "done");
          } else {
            KTUtil.attr(steps[i], "data-ktwizard-state", "pending");
          }
        }
      }
    }
  },
  stepInfoHelper: function (stepsContent) {
    if (stepsContent && stepsContent.length > 0) {
      for (var k = 0, kLen = stepsContent.length; k < kLen; k++) {
        if (i == index) {
          KTUtil.attr(stepsContent[k], "data-ktwizard-state", "current");
        } else {
          KTUtil.removeAttr(stepsContent[k], "data-ktwizard-state");
        }
      }
    }
  },
  eventTriggerHelper: function (the, name) {
    console.log(the, the.events)
    the.events.forEach((event, i) => {
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
    });
  },
  goToHelper(number, eventHandle, the) {

    // Before next and prev events
    var callback;

    if (eventHandle === true) {
      if (number > the.currentStep) {
        callback = KTWizard.Plugin.eventTrigger("beforeNext");
      } else {
        callback = KTWizard.Plugin.eventTrigger("beforePrev");
      }
    }

    // Skip if stopped
    if (the.stopped === true) {
      the.stopped = false;
      return;
    }

    // Continue if no exit
    if (!callback) {
      // Before change
      if (eventHandle === true) {
        KTWizard.Plugin.eventTrigger("beforeChange");
      }

      // Set current step
      the.currentStep = number;

      KTWizard.Plugin.updateUI();

      // Trigger change event
      if (eventHandle === true) {
        KTWizard.Plugin.eventTrigger("change");
      }
    }

    // After next and prev events
    if (eventHandle === true) {
      if (number > the.startStep) {
        KTWizard.Plugin.eventTrigger("afterNext");
      } else {
        KTWizard.Plugin.eventTrigger("afterPrev");
      }
    } else {
      // this function called by method, stop for the next call
      the.stopped = true;
    }

    return the;
  },
  buildHelper: function (the) {
    if (the.options.clickableSteps === true) {
      KTUtil.on(element, '[data-ktwizard-type="step"]', "click", function () {
        var index = Array.prototype.indexOf.call(the.steps, this) + 1;
        if (index !== the.currentStep) {
          KTWizard.Plugin.goTo(index, true);
        }
      });
    }
  },
  getPrevStepHelper: function (currentStep) {
    if (currentStep - 1 >= 1) {
      return currentStep - 1;
    } else {
      return 1;
    }
  },
  getNextStepHelper: function (totalSteps, currentStep) {
    if (totalSteps >= currentStep + 1) {
      return currentStep + 1;
    } else {
      return totalSteps;
    }
  }
}

// webpack support
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = KTWizard;
}
