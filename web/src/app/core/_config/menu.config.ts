import { Resources } from "../../constents/resources";

export class MenuConfig {
  public USERS_MODULE: any = {
    header: {
      self: {},
      uniqueName: Resources.userManagement,
      items: [
        {
          title: "Users",
          root: true,
          alignment: "left",
          toggle: "click",
          page: "users",
          uniqueName: "userManagement:users",
        },
        {
          title: "Roles",
          alignment: "left",
          root: true,
          page: "roles",
          toggle: "click",
          uniqueName: "userManagement:roles",
        },
      ],
    },
  };

  public BUSINESS_CONTENT: any = {
    header: {
      self: {},
      items: [
        {
          title: "Configuration",
          root: true,
          alignment: "left",
          toggle: "hover",
          uniqueName: Resources.contentManagement,
          submenu: [
            {
              title: "Locale Configuration",
              page: "/contentful/contentful-new-locale",
              uniqueName: "contentManagement:createLocale",
            },
            {
              title: "Locale Creation History",
              page: "/contentful/new-locale-history",
              uniqueName: "contentManagement:localeHistory",
            },
            {
              title: "Regional Configuration",
              page: "/contentful/contentful-new-region",
              uniqueName: "contentManagement:createRegion",
            },
            {
              title: "Regional Creation History",
              page: "/contentful/new-region-history",
              uniqueName: "contentManagement:regionHistory",
            },
          ],
        },
        {
          root: true,
          toggle: "hover",
          alignment: "left",
          title: "Content Cloning",
          uniqueName: Resources.contentManagement,
          submenu: [
            {
              title: "Initiate Content Cloning",
              page: "/contentful/market-clone",
              uniqueName: "contentManagement:createClone",
            },
            {
              title: "Content Cloning History",
              page: "/contentful/market-clone-history",
              uniqueName: "contentManagement:cloneHistory",
            },
          ],
        },        
        {
          root: true,
          toggle: "hover",
          alignment: "left",
          title: "Content Localization",
          uniqueName: Resources.contentManagement,
          submenu: [
            {
              title: "New Localization",
              page: "/contentful/translate",
              uniqueName: "contentManagement:translation",
            },            
            {
              title: "All Content Localization History",
              page: "/contentful/translate-allhistory",
              uniqueName: "contentManagement:translationAllHistory",
            },
            {
              title: "Specific Content Localization History",
              page: "/contentful/translate-history",
              uniqueName: "contentManagement:translationHistory",
            },
            // {
            //   title: "Clone/Translate",
            //   page: "/contentful/app-contentful-market-expansion",
            //   uniqueName: "contentManagement:cloneTranslate",
            // },
            // {
            //   title: "Clone/Translation History",
            //   page: "/contentful/app-new-market-translation-history",
            //   uniqueName: "contentManagement:cloneHistory",
            // },
          ],
        },

        {
          title: "Content Migration",
          root: true,
          uniqueName: Resources.contentManagement,
          toggle: "hover",
          alignment: "left",
          submenu: [
            {
              title: "New Migration",
              page: "/contentful/contentful-migration",
              uniqueName: "contentManagement:migration",
            },
            {
              title: "Migration History",
              page: "/contentful/migration-history",
              uniqueName: "contentManagement:history",
            },
            {
              title: "Rollback History",
              page: "/contentful/rollback-history",
              uniqueName: "contentManagement:rollbackHistory",
            },
          ],
        },
        {
          root: true,
          toggle: "hover",
          alignment: "left",
          title: "Content Review",
          uniqueName: Resources.contentManagement,
          submenu: [
            {
              title: "Content Awaiting Review",
              page: "/contentful/reviewer-translate",
              uniqueName: "contentManagement:reviewer",
            },
            {
              title: "Review History",
              page: "/contentful/reviewer-translate-history",
              uniqueName: "contentManagement:reviewerHistory",
            },
          ],
        },
       
     
      ],
    },
  };



  public Contentful: any = {
    header: {
      self: {},
      uniqueName: Resources.contentManagement,
      items: [
        {
          title: "Migration",
          root: true,
          alignment: "left",
          page: "contentful-migration",
          dataTestId: "contentful-migration",
          toggle: "click",
          uniqueName: "contentManagement:migration",
        },
        {
          title: "History",
          root: true,
          alignment: "left",
          page: "migration-history",
          dataTestId: "migration-history",
          toggle: "click",
          uniqueName: "contentManagement:history",
        },
        {
          page: "translate",
          toggle: "click",
          uniqueName: "contentManagement:migration",
          title: "Translate",
          root: true,
          alignment: "left",
        },
        {
          page: "marketExpantion",
          toggle: "click",
          uniqueName: "contentManagement:migration",
          title: "market Expantion",
          root: true,
          alignment: "left",
        },
      ],
    },
  };

  public BUSINESS_CONTENT_CRM: any = {
    header: {
      self: {},
      items: [
        
        {
          root: true,
          toggle: "hover",
          alignment: "left",
          title: "CRM Translation",
          uniqueName: Resources.crmManagement,
          submenu: [
            {
              title: "Manage",
              page: "/crm/crm-translate",
              uniqueName: "crmManagement:translation",
            },
            {
              title: "Translation History",
              page: "/crm/crm-translate-history",
              uniqueName: "crmManagement:translationHistory",
            },
          ],
        },
        {
          root: true,
          toggle: "hover",
          alignment: "left",
          title: "CRM Reviewer Translation",
          uniqueName: Resources.crmManagement,
          submenu: [
            {
              title: "CRM Reviewer Manage",
              page: "/crm/crm-reviewer-translate",
              uniqueName: "crmManagement:reviewer",
            },
            {
              title: "CRM Reviewer History",
              page: "/crm/crm-reviewer-translate-history",
              uniqueName: "crmManagement:reviewerHistory",
            },
          ],
        },
        {
          title: "CRM Migration",
          root: true,
          uniqueName: Resources.crmManagement,
          toggle: "hover",
          alignment: "left",
          submenu: [
            {
              title: "Migration",
              page: "/crm/crm-migration",
              uniqueName: "crmManagement:migration",
            },
            {
              title: "History",
              page: "/crm/crm-migration-history",
              uniqueName: "crmManagement:history",
            },
          ],
        },
       
        // bulkMigration
        {
          title: "Bulk Migration",
          root: true,
          uniqueName: Resources.crmManagement,
          toggle: "hover",
          alignment: "left",
          submenu: [
            {
              title: "Migration",
              page: "/crm/crm-bulk-migration",
              uniqueName: "crmManagement:bulkMigration",
            },           
          ],
        },
      
      ],
    },
  };

  public BUSINESS_MARKET_REVIEW: any = {
    header: {
      self: {},
      items: [
        
        {
          root: true,
          toggle: "hover",
          alignment: "left",
          title: "Translation",
          uniqueName: Resources.marketReview,
          submenu: [
            {
              title: "Manage",
              page: "/market-review/market-review-translate",
              uniqueName: "marketManagement:translation",
            },
            {
              title: "Translation History",
              page: "/market-review/market-review-translate-history",
              uniqueName: "marketManagement:translationHistory",
            },
          ],
        },
    
      ],
    },
  };

  public CONFIG_MANAGEMENT: any = {
    header: {
      uniqueName: Resources.configManagement,
      self: {},
      items: [
      
        {
          title: "History",
          root: true,
          toggle: "click",
          alignment: "left",
          page: "config-history",
          uniqueName: "configManagement:history",
        },
        {
          title: "Clone",
          page: "config-clone",
          root: true,
          toggle: "click",
          uniqueName: "configManagement:clone",
          alignment: "left",
        },
      ],
    },
  };



 

  public BUSINESS_MARKET_EXPANSION: any = {
    header: {
      self: {},
      items: [
        
      
        {
          root: true,
          toggle: "hover",
          alignment: "left",
          title: "Content Localization",
          uniqueName: Resources.marketExpantion,
          submenu: [
            {
              title: "Clone/Translate",
              page: "/contentful/contentful-market-expansion",
              uniqueName: "marketExpantion:translate",
            },
            {
              title: "Clone/Translation History",
              page: "/contentful/new-market-translation-history",
              uniqueName: "marketExpantion:history",
            },
          ],
        },
      ],
    },
  };

  public BUSINESS_ADMIN_PANEL: any = {
    header: {
      self: {},
      items: [
        
        {
          root: true,
          toggle: "hover",
          alignment: "left",
          title: "Audit Trail History",
          uniqueName: Resources.adminPanel,
          submenu: [
            {
              title: "Audit Trail History",
              page: "/admin-panel/audit-trail-history",
              uniqueName: "adminPanel:auditTrail",
            }
          ],
        },

        {
          root: true,
          toggle: "hover",
          alignment: "left",
          title: "User Management",
          uniqueName: Resources.adminPanel,
          submenu: [           
            {
              title: "User",
              page: "/admin-panel/users",
              uniqueName: "adminPanel:users",
            },
            {
              title: "Role",
              page: "/admin-panel/roles",
              uniqueName: "adminPanel:roles",
            },
          ],
        },
      
      ],
    },
  };

  public default: any = {
    header: {
      self: {},
      items: [
        {
          title: "Dashboards",
          root: true,
          alignment: "left",
          page: "/dashboard",
          translate: "MENU.DASHBOARD",
        },
        {
          title: "Components",
          root: true,
          alignment: "left",
          toggle: "click",
          submenu: [
            {
              title: "Google Material",
              bullet: "dot",
              icon: "flaticon-interface-7",
              submenu: [
                {
                  title: "Form Controls",
                  bullet: "dot",
                  submenu: [
                    {
                      title: "Auto Complete",
                      page: "/material/form-controls/autocomplete",
                      permission: "accessToECommerceModule",
                    },
                    {
                      title: "Checkbox",
                      page: "/material/form-controls/checkbox",
                    },
                    {
                      title: "Radio Button",
                      page: "/material/form-controls/radiobutton",
                    },
                    {
                      title: "Datepicker",
                      page: "/material/form-controls/datepicker",
                    },
                    {
                      title: "Form Field",
                      page: "/material/form-controls/formfield",
                    },
                    {
                      title: "Input",
                      page: "/material/form-controls/input",
                    },
                    {
                      title: "Select",
                      page: "/material/form-controls/select",
                    },
                    {
                      title: "Slider",
                      page: "/material/form-controls/slider",
                    },
                    {
                      title: "Slider Toggle",
                      page: "/material/form-controls/slidertoggle",
                    },
                  ],
                },
                {
                  title: "Navigation",
                  bullet: "dot",
                  submenu: [
                    {
                      title: "Menu",
                      page: "/material/navigation/menu",
                    },
                    {
                      title: "Sidenav",
                      page: "/material/navigation/sidenav",
                    },
                    {
                      title: "Toolbar",
                      page: "/material/navigation/toolbar",
                    },
                  ],
                },
                {
                  title: "Layout",
                  bullet: "dot",
                  submenu: [
                    {
                      title: "Card",
                      page: "/material/layout/card",
                    },
                    {
                      title: "Divider",
                      page: "/material/layout/divider",
                    },
                    {
                      title: "Expansion panel",
                      page: "/material/layout/expansion-panel",
                    },
                    {
                      title: "Grid list",
                      page: "/material/layout/grid-list",
                    },
                    {
                      title: "List",
                      page: "/material/layout/list",
                    },
                    {
                      title: "Tabs",
                      page: "/material/layout/tabs",
                    },
                    {
                      title: "Stepper",
                      page: "/material/layout/stepper",
                    },
                    {
                      title: "Default Forms",
                      page: "/material/layout/default-forms",
                    },
                    {
                      title: "Tree",
                      page: "/material/layout/tree",
                    },
                  ],
                },
                {
                  title: "Buttons & Indicators",
                  bullet: "dot",
                  submenu: [
                    {
                      title: "Button",
                      page: "/material/buttons-and-indicators/button",
                    },
                    {
                      title: "Button toggle",
                      page: "/material/buttons-and-indicators/button-toggle",
                    },
                    {
                      title: "Chips",
                      page: "/material/buttons-and-indicators/chips",
                    },
                    {
                      title: "Icon",
                      page: "/material/buttons-and-indicators/icon",
                    },
                    {
                      title: "Progress bar",
                      page: "/material/buttons-and-indicators/progress-bar",
                    },
                    {
                      title: "Progress spinner",
                      page: "/material/buttons-and-indicators/progress-spinner",
                    },
                    {
                      title: "Ripples",
                      page: "/material/buttons-and-indicators/ripples",
                    },
                  ],
                },
                {
                  title: "Popups & Modals",
                  bullet: "dot",
                  submenu: [
                    {
                      title: "Bottom sheet",
                      page: "/material/popups-and-modals/bottom-sheet",
                    },
                    {
                      title: "Dialog",
                      page: "/material/popups-and-modals/dialog",
                    },
                    {
                      title: "Snackbar",
                      page: "/material/popups-and-modals/snackbar",
                    },
                    {
                      title: "Tooltip",
                      page: "/material/popups-and-modals/tooltip",
                    },
                  ],
                },
                {
                  title: "Data table",
                  bullet: "dot",
                  submenu: [
                    {
                      title: "Paginator",
                      page: "/material/data-table/paginator",
                    },
                    {
                      title: "Sort header",
                      page: "/material/data-table/sort-header",
                    },
                    {
                      title: "Table",
                      page: "/material/data-table/table",
                    },
                  ],
                },
              ],
            },
            {
              title: "Ng-Bootstrap",
              bullet: "dot",
              icon: "flaticon-web",
              submenu: [
                {
                  title: "Accordion",
                  page: "/ngbootstrap/accordion",
                },
                {
                  title: "Alert",
                  page: "/ngbootstrap/alert",
                },
                {
                  title: "Buttons",
                  page: "/ngbootstrap/buttons",
                },
                {
                  title: "Carousel",
                  page: "/ngbootstrap/carousel",
                },
                {
                  title: "Collapse",
                  page: "/ngbootstrap/collapse",
                },
                {
                  title: "Datepicker",
                  page: "/ngbootstrap/datepicker",
                },
                {
                  title: "Dropdown",
                  page: "/ngbootstrap/dropdown",
                },
                {
                  title: "Modal",
                  page: "/ngbootstrap/modal",
                },
                {
                  title: "Pagination",
                  page: "/ngbootstrap/pagination",
                },
                {
                  title: "Popover",
                  page: "/ngbootstrap/popover",
                },
                {
                  title: "Progressbar",
                  page: "/ngbootstrap/progressbar",
                },
                {
                  title: "Rating",
                  page: "/ngbootstrap/rating",
                },
                {
                  title: "Tabs",
                  page: "/ngbootstrap/tabs",
                },
                {
                  title: "Timepicker",
                  page: "/ngbootstrap/timepicker",
                },
                {
                  title: "Tooltips",
                  page: "/ngbootstrap/tooltip",
                },
                {
                  title: "Typehead",
                  page: "/ngbootstrap/typehead",
                },
              ],
            },
          ],
        },
        {
          title: "Applications",
          root: true,
          alignment: "left",
          toggle: "click",
          submenu: [
            {
              title: "eCommerce",
              bullet: "dot",
              icon: "flaticon-business",
              permission: "accessToECommerceModule",
              submenu: [
                {
                  title: "Customers",
                  page: "/ecommerce/customers",
                },
                {
                  title: "Products",
                  page: "/ecommerce/products",
                },
              ],
            },
            {
              title: "User Management",
              bullet: "dot",
              icon: "flaticon-user",
              submenu: [
                {
                  title: "Users",
                  page: "/user-management/users",
                },
                {
                  title: "Roles",
                  page: "/user-management/roles",
                },
              ],
            },
          ],
        },
        {
          title: "Custom",
          root: true,
          alignment: "left",
          toggle: "click",
          submenu: [
            {
              title: "Error Pages",
              bullet: "dot",
              icon: "flaticon2-list-2",
              submenu: [
                {
                  title: "Error 1",
                  page: "/error/error-v1",
                },
                {
                  title: "Error 2",
                  page: "/error/error-v2",
                },
                {
                  title: "Error 3",
                  page: "/error/error-v3",
                },
                {
                  title: "Error 4",
                  page: "/error/error-v4",
                },
                {
                  title: "Error 5",
                  page: "/error/error-v5",
                },
                {
                  title: "Error 6",
                  page: "/error/error-v6",
                },
              ],
            },
            {
              title: "Wizard",
              bullet: "dot",
              icon: "flaticon2-mail-1",
              submenu: [
                {
                  title: "Wizard 1",
                  page: "/wizard/wizard-1",
                },
                {
                  title: "Wizard 2",
                  page: "/wizard/wizard-2",
                },
                {
                  title: "Wizard 3",
                  page: "/wizard/wizard-3",
                },
                {
                  title: "Wizard 4",
                  page: "/wizard/wizard-4",
                },
              ],
            },
          ],
        },
      ],
    },
    aside: {
      self: {},
      items: [
        {
          title: "Dashboard",
          root: true,
          icon: "flaticon2-architecture-and-city",
          page: "/block-user",
          translate: "MENU.DASHBOARD",
          bullet: "dot",
        },
        {
          title: "Layout Builder",
          root: true,
          icon: "flaticon2-expand",
          page: "/builder",
        },
        { section: "Components" },
        {
          title: "Google Material",
          root: true,
          bullet: "dot",
          icon: "flaticon2-browser-2",
          submenu: [
            {
              title: "Form Controls",
              bullet: "dot",
              submenu: [
                {
                  title: "Auto Complete",
                  page: "/material/form-controls/autocomplete",
                  permission: "accessToECommerceModule",
                },
                {
                  title: "Checkbox",
                  page: "/material/form-controls/checkbox",
                },
                {
                  title: "Radio Button",
                  page: "/material/form-controls/radiobutton",
                },
                {
                  title: "Datepicker",
                  page: "/material/form-controls/datepicker",
                },
                {
                  title: "Form Field",
                  page: "/material/form-controls/formfield",
                },
                {
                  title: "Input",
                  page: "/material/form-controls/input",
                },
                {
                  title: "Select",
                  page: "/material/form-controls/select",
                },
                {
                  title: "Slider",
                  page: "/material/form-controls/slider",
                },
                {
                  title: "Slider Toggle",
                  page: "/material/form-controls/slidertoggle",
                },
              ],
            },
            {
              title: "Navigation",
              bullet: "dot",
              submenu: [
                {
                  title: "Menu",
                  page: "/material/navigation/menu",
                },
                {
                  title: "Sidenav",
                  page: "/material/navigation/sidenav",
                },
                {
                  title: "Toolbar",
                  page: "/material/navigation/toolbar",
                },
              ],
            },
            {
              title: "Layout",
              bullet: "dot",
              submenu: [
                {
                  title: "Card",
                  page: "/material/layout/card",
                },
                {
                  title: "Divider",
                  page: "/material/layout/divider",
                },
                {
                  title: "Expansion panel",
                  page: "/material/layout/expansion-panel",
                },
                {
                  title: "Grid list",
                  page: "/material/layout/grid-list",
                },
                {
                  title: "List",
                  page: "/material/layout/list",
                },
                {
                  title: "Tabs",
                  page: "/material/layout/tabs",
                },
                {
                  title: "Stepper",
                  page: "/material/layout/stepper",
                },
                {
                  title: "Default Forms",
                  page: "/material/layout/default-forms",
                },
                {
                  title: "Tree",
                  page: "/material/layout/tree",
                },
              ],
            },
            {
              title: "Buttons & Indicators",
              bullet: "dot",
              submenu: [
                {
                  title: "Button",
                  page: "/material/buttons-and-indicators/button",
                },
                {
                  title: "Button toggle",
                  page: "/material/buttons-and-indicators/button-toggle",
                },
                {
                  title: "Chips",
                  page: "/material/buttons-and-indicators/chips",
                },
                {
                  title: "Icon",
                  page: "/material/buttons-and-indicators/icon",
                },
                {
                  title: "Progress bar",
                  page: "/material/buttons-and-indicators/progress-bar",
                },
                {
                  title: "Progress spinner",
                  page: "/material/buttons-and-indicators/progress-spinner",
                },
                {
                  title: "Ripples",
                  page: "/material/buttons-and-indicators/ripples",
                },
              ],
            },
            {
              title: "Popups & Modals",
              bullet: "dot",
              submenu: [
                {
                  title: "Bottom sheet",
                  page: "/material/popups-and-modals/bottom-sheet",
                },
                {
                  title: "Dialog",
                  page: "/material/popups-and-modals/dialog",
                },
                {
                  title: "Snackbar",
                  page: "/material/popups-and-modals/snackbar",
                },
                {
                  title: "Tooltip",
                  page: "/material/popups-and-modals/tooltip",
                },
              ],
            },
            {
              title: "Data table",
              bullet: "dot",
              submenu: [
                {
                  title: "Paginator",
                  page: "/material/data-table/paginator",
                },
                {
                  title: "Sort header",
                  page: "/material/data-table/sort-header",
                },
                {
                  title: "Table",
                  page: "/material/data-table/table",
                },
              ],
            },
          ],
        },
        {
          title: "Ng-Bootstrap",
          root: true,
          bullet: "dot",
          icon: "flaticon2-digital-marketing",
          submenu: [
            {
              title: "Accordion",
              page: "/ngbootstrap/accordion",
            },
            {
              title: "Alert",
              page: "/ngbootstrap/alert",
            },
            {
              title: "Buttons",
              page: "/ngbootstrap/buttons",
            },
            {
              title: "Carousel",
              page: "/ngbootstrap/carousel",
            },
            {
              title: "Collapse",
              page: "/ngbootstrap/collapse",
            },
            {
              title: "Datepicker",
              page: "/ngbootstrap/datepicker",
            },
            {
              title: "Dropdown",
              page: "/ngbootstrap/dropdown",
            },
            {
              title: "Modal",
              page: "/ngbootstrap/modal",
            },
            {
              title: "Pagination",
              page: "/ngbootstrap/pagination",
            },
            {
              title: "Popover",
              page: "/ngbootstrap/popover",
            },
            {
              title: "Progressbar",
              page: "/ngbootstrap/progressbar",
            },
            {
              title: "Rating",
              page: "/ngbootstrap/rating",
            },
            {
              title: "Tabs",
              page: "/ngbootstrap/tabs",
            },
            {
              title: "Timepicker",
              page: "/ngbootstrap/timepicker",
            },
            {
              title: "Tooltips",
              page: "/ngbootstrap/tooltip",
            },
            {
              title: "Typehead",
              page: "/ngbootstrap/typehead",
            },
          ],
        },
        { section: "Applications" },
        {
          title: "eCommerce",
          bullet: "dot",
          icon: "flaticon2-list-2",
          root: true,
          permission: "accessToECommerceModule",
          submenu: [
            {
              title: "Customers",
              page: "/ecommerce/customers",
            },
            {
              title: "Products",
              page: "/ecommerce/products",
            },
          ],
        },
        {
          title: "User Management",
          root: true,
          bullet: "dot",
          icon: "flaticon2-user-outline-symbol",
          submenu: [
            {
              title: "Users",
              page: "/users",
            },
            {
              title: "Roles",
              page: "/roles",
            },
          ],
        },
        { section: "Custom" },
        {
          title: "Error Pages",
          root: true,
          bullet: "dot",
          icon: "flaticon2-list-2",
          submenu: [
            {
              title: "Error 1",
              page: "/error/error-v1",
            },
            {
              title: "Error 2",
              page: "/error/error-v2",
            },
            {
              title: "Error 3",
              page: "/error/error-v3",
            },
            {
              title: "Error 4",
              page: "/error/error-v4",
            },
            {
              title: "Error 5",
              page: "/error/error-v5",
            },
            {
              title: "Error 6",
              page: "/error/error-v6",
            },
          ],
        },
        {
          title: "Wizard",
          root: true,
          bullet: "dot",
          icon: "flaticon2-mail-1",
          submenu: [
            {
              title: "Wizard 1",
              page: "/wizard/wizard-1",
            },
            {
              title: "Wizard 2",
              page: "/wizard/wizard-2",
            },
            {
              title: "Wizard 3",
              page: "/wizard/wizard-3",
            },
            {
              title: "Wizard 4",
              page: "/wizard/wizard-4",
            },
          ],
        },
      ],
    },
  };

  public get defaultConfigs(): any {
    return this.default;
  }
 
  public get getBusinessMarketExpansionConfigs(): any {
    return this.BUSINESS_MARKET_EXPANSION;
  }



  public get getUsersModuleConfigs(): any {
    return this.USERS_MODULE;
  }

  public get getConfigManageConfigs(): any {
    return this.CONFIG_MANAGEMENT;
  }



  public get getBusinessContentConfigs(): any {
    return this.BUSINESS_CONTENT;
  }






  public get getContentfulModuleConfigs(): any {
    return this.Contentful;
  }

  public get getCrmModuleConfigs(): any {
    return this.BUSINESS_CONTENT_CRM;
  }

  public get getMarketReviewConfig(): any {
    return this.BUSINESS_MARKET_REVIEW;
  }

  public get getAdminPanelConfigs(): any {
    return this.BUSINESS_ADMIN_PANEL;
  }

}
