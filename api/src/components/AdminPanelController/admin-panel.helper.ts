import { AuditModel } from "../../entities";
import moment from "moment-timezone";

class AdminPanelHelper {
  constructor() {
    console.log("constructor");
  }

  /**
   * create audit trail
   */
  async  createAuditTrail(payload) {
    AuditModel.create({
      email: payload.email,
      module: payload.module,
      action: payload.action,
      data: payload.data,
      submodule : payload.submodule,
      user : payload.user,
      status : payload.status,
      type: payload.type,
      errorDetails : payload.errorDetails ? payload.errorDetails : null,
      actionDetails : payload.actionDetails,
      reqPayload : payload.reqPayload
    });
    // return data;
  }

  /**
   * Map module and sub module list
   */
  async getModuleList() {
      const moduleMap = {
        "Admin Panel": {
            default: { $in: ["Admin Panel Audit", "User", "Role"] },
            subModules: {
                "Audit Trail": "Admin Panel Audit",
                "Users": "User",
                "Roles" : "Role"
            }
        },
        "Messaging": {
          default: { $in: ["CRM Reviewer Translation", "CRM reviewer record", "CRM Reviewer History","CRM AI Approve Message", "CRM Translation", "CRM Translation History", "CRM Migration", "CRM Migration History", "Bulk Migration"] },
          subModules: {
              "Reviewer":  { $in: ["CRM Reviewer Translation","CRM reviewer record","CRM AI Approve Message"]},
              "Reviewer History": "CRM Reviewer History",
              "CRM Translation": "CRM Translation",
              "CRM Translation History": "CRM Translation History",
              "CRM Migration": "CRM Migration",
              "CRM History": "CRM Migration History",
              "Bulk Migration": "Bulk Migration",

          }
      },
      "App": {
          default: { $in: ["Reviewer Translation", "reviewer record","AI Approve Message", "Content Reviewer History", "Content Translation", "Content Translation History", "Content Migration", "Content Migration History", "Locale Management", "Locale Management History","AI History", "AI Translate", "Clone Content", "Clone History", "Create Region Mapping", "Regional Creation History", "Rollback Migration", "Migration Rollback History"] },
          subModules: {
              "Create New Locale": "Locale Management",
              "Locale Creation History": "Locale Management History",
              "Regional Creation": "Create Region Mapping",
              "Regional Creation History": "Regional Creation History",
              "Content Awaiting Review":  { $in: ["Reviewer Translation", "reviewer record","AI Approve Message"]},
              "Review History": "Content Reviewer History",
              "New Localization ": "Content Translation",
              "Specific Content Translation History": "Content Translation History",
              "New Migration": "Content Migration",
              "Migration History": "Content Migration History",
              "New Localization": "AI Translate",
              "All Content Localization History": "AI History",
              "Initiate Content Cloning": "Clone Content",
              "Content Cloning History": "Clone History",
              "Rollback Creation": "Rollback Migration",
              "Rollback History": "Migration Rollback History",
          }
      },
    };
    return moduleMap;
  }

  /**
   * get module and sub module list
   */
    async getSubModuleList() {
     
      const moduleMappings = {
        "Admin Panel Audit": { module: "Admin Panel", submodule: "Audit Trail" },
        "User": { module: "Admin Panel", submodule: "Users" },
        "Role": { module: "Admin Panel", submodule: "Roles" },
        "Locale Management": { module: "App", submodule: "Locale Configuration" },
        "Locale Management History": { module: "App", submodule: "Locale Creation History" },
        "Create Region Mapping": { module: "App", submodule: "Regional Configuration" },
        "Regional Creation History": { module: "App", submodule: "Regional Creation History" },
        "AI Translate": { module: "App", submodule: "New Localization" },
        "AI History": { module: "App", submodule: "All Content Localization History" },
        "CRM Reviewer Translation": { module: "Messaging", submodule: "Reviewer" },
        "CRM reviewer record": { module: "Messaging", submodule: "Reviewer" },
        "CRM AI Approve Message": { module: "CRM Management", submodule: "Reviewer" },
        "CRM Reviewer History": { module: "Messaging", submodule: "Reviewer History" },
        "CRM Translation": { module: "Messaging", submodule: "CRM Translation" },
        "CRM Translation History": { module: "Messaging", submodule: "CRM Translation History" },
        "CRM Migration": { module: "Messaging", submodule: "CRM Migration" },
        "CRM Migration History": { module: "Messaging", submodule: "CRM Migration History" },
        "Bulk Migration": { module: "Messaging", submodule: "Bulk Migration" },
        "Reviewer Translation": { module: "App", submodule: "Content Awaiting Review" },
        "reviewer record": { module: "App", submodule: "Content Awaiting Review" },
        "AI Approve Message": { module: "App", submodule: "Content Awaiting Review" },
        "Content Reviewer History": { module: "App", submodule: "Review History" },
        "Content Translation": { module: "App", submodule: "New Localization" },
        "Content Translation History": { module: "App", submodule: "Specific Content Localization History" },
        "Content Migration": { module: "App", submodule: "New Migration" },
        "Content Migration History": { module: "App", submodule: "Migration History" },
        "Clone Content": { module: "App", submodule: "Initiate Content Cloning" },
        "Clone History": { module: "App", submodule: "Content Cloning History" },
        "Rollback Migration": { module: "App", submodule: "Rollback Creation" },
        "Migration Rollback History": { module: "App", submodule: "Rollback History" },
      };
    return moduleMappings;
  }

  /**
   * get admin filter list
   */
  async getAdminFilter(query) {
    const { module, fromDate, toDate, timezone, subModule, organization, userId, role } = query;
    const filter: any = {};

    // Handle module and subModule filtering
    if (module) {
        const moduleMap = await this.getModuleList();
        const selectedModule = moduleMap[module];
        filter.module = selectedModule?.subModules?.[subModule] || selectedModule?.default;
    }

    // Handle date range filtering
    if (timezone && (fromDate || toDate)) {
        filter.updatedAt = {
            ...(fromDate && { $gte: moment.tz(fromDate, timezone).startOf("day").utc().toDate() }),
            ...(toDate && { $lte: moment.tz(toDate, timezone).endOf("day").utc().toDate() })
        };
    }

    // Handle organization filtering
    if (organization) {
        filter["user.organization"] = organization === "Others"
            ? { $exists: true, $nin: ["AYM", "P&G", "S&S"] }
            : organization;
    }

    // Handle userId and role filtering
    if (userId) { filter.email = userId; }
    if (role) { filter["user.role"] = role; }

    return filter;
  }

  /**
   * get user filter list
   */
  async getUserFilter(condition) {
    const filterList: any = {};

    // Normalize sortBy field
    if (condition.sortBy === "addedOnDate") {
        condition.sortBy = "createdAt";
    }

    // Use Object.assign to conditionally add properties
    Object.assign(filterList, 
        condition.role && { role: condition.role },
        condition.market && { markets: condition.market },
        condition.region && { region: condition.region },
        condition.locale && { locales: condition.locale },
        condition.organization && {
            organization: condition.organization === "Others"
                ? { $nin: ["AYM", "P&G", "S&S"] }
                : condition.organization
        },
        condition.userId && { email: condition.userId },
        (condition.status === false || condition.status === true) && { enabled: condition.status }
    );

    // Handle addedDate and lastLogin with timezone filtering
    const addDateFilter = (date, timezone) => {
        const startOfDay = moment(date).tz(timezone).startOf("day").utc().toDate();
        const endOfDay = moment(date).tz(timezone).endOf("day").utc().toDate();
        return { $gte: startOfDay, $lt: endOfDay };
    };

    if (condition.addedDate && condition.timezone) {
        filterList.createdAt = addDateFilter(condition.addedDate, condition.timezone);
    }

    if (condition.lastLogin && condition.timezone) {
        filterList.lastLoginDate = addDateFilter(condition.lastLogin, condition.timezone);
    }

    return filterList;
  }

  /**
   * get adudit update use action details
   */
  async getAuditUserDetails(email, modifiedUser, modifiedReq,originalUser, attributes) {
    let actionDetails = "";
    actionDetails = `{"message" : "Updated ${
      email
    } user details",  "existing" : ${JSON.stringify(
      [modifiedUser],
      null,
      2
    )}, "Updated" : ${JSON.stringify([modifiedReq], null, 2)}}`;

    if (originalUser.enabled && (!attributes.enabled || attributes.enabled === "false") ) {
      actionDetails = `User ${email} has been deactivated.`;
    } else if (!originalUser.enabled && attributes.enabled) {
      actionDetails = `User ${email} has been activated.`;
    }

    return actionDetails;
  }

  /**
   * get adudit update use action details
   */
    async getAuditUserErrorDetails(email, originalUser, attributes) {

      let actionDetails = `Failed to update the details of ${email}`;

      if (originalUser && originalUser.enabled && !attributes.enabled) {
        actionDetails = `Failed attempt to deactivate the user ${email}.`;
      } else if (originalUser && !originalUser.enabled && attributes.enabled) {
        actionDetails = `Failed attempt to activate the user ${email}.`;
      }
  
      return actionDetails;
    }
  
  }



export default new AdminPanelHelper();
