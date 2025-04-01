const updateConfig = "configManagement:config:updateConfig";
const rollbackConfig = "configManagement:history:rollbackConfig";
const cloneConfig = "configManagement:clone:cloneConfig";
const getConfig = "configManagement:config:getConfig";
const getConfigHistory = "configManagement:history:getConfigHistory";

const createLocale = "localeManagement:create:createLocale";
const getLocaleHistory = "localeManagement:history:getLocaleHistory";

const createClone = "contentManagement:createClone:createClone";
const getCloneHistory = "contentManagement:cloneHistory:cloneHistory";

const translateOrClone = "marketExpantion:translate:translateOrClone";
const getAllTranslateHistory = "marketExpantion:history:getAllTranslateHistory";

const generateCode = "codeGeneration:generator:generateCode";
const exportCode = "codeGeneration:export:exportCodes";
const getHistory = "codeGeneration:history:getHistory";
const codeUpdate = "codeGeneration:codeUpdate:codeUpdateProcess";
const opsView = "codeGeneration:opsView:getOpsView";
const activationHistory =
  "codeGeneration:activationHistory:getActivationHistory";

const migrateCreation = "contentManagement:migration:createMigration";
const migrationHistory = "contentManagement:history:getAllMigrationHistory";
const translationCreation = "contentManagement:translation:createTranslation";
const translationHistory =
  "contentManagement:translationHistory:translationHistory";
  const translationAllHistory =
  "contentManagement:translationAllHistory:translationAllHistory";
const crmMigrateCreation = "crmManagement:migration:createMigration";
const crmMigrationHistory = "crmManagement:history:getAllMigrationHistory";
const crmTranslationCreation = "crmManagement:translation:createTranslation";
const crmTranslationHistory =
  "crmManagement:translationHistory:translationHistory";
  const reviewerTranslate = "contentManagement:reviewer:createTranslation";
const reviewerHistory = "contentManagement:reviewerHistory:reviewerHistory";
const crmBulkMigrateData = "crmManagement:bulkMigration:bulkMigration";

const marketTranslationCreation =
  "marketManagement:translation:createTranslation";
const marketTranslationHistory =
  "marketManagement:translationHistory:translationHistory";

const getAllTransactions = "diaperfitfinder:transactions:getAllTransactions";
const exportTransactions = "diaperfitfinder:transactions:exportTransactions";
const getAllProductVariables =
  "diaperfitfinder:productVariables:getAllProductVariables";
const getPaperClassification =
  "diaperfitfinder:paperClassification:getPaperClassification";
const createResearchers = "diaperfitfinder:createResearchers:createResearchers";
const getResearcherHistory = "diaperfitfinder:researchersHistory:getHistory";
const decryptPassword = "diaperfitfinder:researchersPassword:decryptPassword";
const getAllExports = "downloads:exports:getAllExports";
const getAllFulfilmentHistory = "fulfilment:history:getAllFulfilmentHistory";
const tierOneHistory = "fulfilment:tierOneHistory:tierOneHistory";
const retryFulfilment = "fulfilment:tierOneHistory:retryFulfilment";
const searchUsers = "operations:blockUnblockUsers:searchUsers";
const checkUserStatus = "operations:blockUnblockUsers:checkUserStatus";
const blockOrUnblockUser = "operations:blockUnblockUsers:blockOrUnblockUser";
const codeSearch = "codeSearch:searchCode:getCodeData";
const searchLogs = "operations:logs:searchLogs";
const getAllLocale = "operations:config-maintenance:getAllLocale";
const statusUpdate = "operations:config-maintenance:statusUpdate";
const getLocaleInfo = "operations:config-maintenance:getLocaleInfo";
const getAllUsers = "adminPanel:users:getAllUsers";
const editUser = "adminPanel:users:editUser";
const deleteUser = "adminPanel:users:deleteUser";
const exportUserList = "adminPanel:users:exportUserList";
const getAllRoles = "adminPanel:roles:getAllRoles";
const editRole = "adminPanel:roles:editRole";
const deleteRole = "adminPanel:roles:deleteRole";
const exportHistory = "reconciliation:orderHistory:exportHistory";
const viewHistory = "reconciliation:orderHistory:viewHistory";
const refundOrder = "reconciliation:orderHistory:refundOrder";
const showBlackList = "operations:security:showBlackList";
const addBlackList = "operations:security:addBlackList";
const deleteBlackList = "operations:security:deleteBlackList";
const getSummary = "operations:summary:getSummary";
const searchData = "gdpr:dataDeletion:searchData";
const deleteData = "gdpr:dataDeletion:deleteData";
const createJob = "gdpr:dataHistory:createJob";
const gdprHistory = "gdpr:dataHistory:getHistory";

const getAllPartners = "fulfilment:partnerManagement:getAllPartners";
const editPartner = "fulfilment:partnerManagement:editPartner";
const getAllFulfilmentAPIHistory =
  "fulfilment:fulfilmentApiHistory:getAllFulfilmentAPIHistory";

const retryDeActivateCoupons =
  "reconciliation:orderHistory:retryDeActivateCoupons";

export default class Services {
  // config management
  static [getConfig] = getConfig;
  static [rollbackConfig] = rollbackConfig;
  static [cloneConfig] = cloneConfig;
  static [getConfigHistory] = getConfigHistory;
  static [updateConfig] = updateConfig;

  // locale Management
  static [createLocale] = createLocale;
  static [getLocaleHistory] = getLocaleHistory;

  static [translateOrClone] = translateOrClone;
  static [getAllTranslateHistory] = getAllTranslateHistory;

  // code generation
  static [generateCode] = generateCode;
  static [exportCode] = exportCode;
  static [getHistory] = getHistory;
  static [codeUpdate] = codeUpdate;
  static [opsView] = opsView;
  static [activationHistory] = activationHistory;

  // code search
  static [codeSearch] = codeSearch;

  // content migration
  static [migrateCreation] = migrateCreation;
  static [migrationHistory] = migrationHistory;
  static [translationCreation] = translationCreation;
  static [translationHistory] = translationHistory;
  static [translationAllHistory] = translationAllHistory;
  static [reviewerTranslate] = reviewerTranslate;
  static [reviewerHistory] = reviewerHistory;
  static [createClone] = createClone;
  static [getCloneHistory] = getCloneHistory;

  // crm migration
  static [crmMigrateCreation] = crmMigrateCreation;
  static [crmMigrationHistory] = crmMigrationHistory;
  static [crmTranslationCreation] = crmTranslationCreation;
  static [crmTranslationHistory] = crmTranslationHistory;
  static [crmBulkMigrateData] = crmBulkMigrateData;

  // Market review
  static [marketTranslationCreation] = marketTranslationCreation;
  static [marketTranslationHistory] = marketTranslationHistory;

  // diaper fit finder
  static [getAllTransactions] = getAllTransactions;
  static [exportTransactions] = exportTransactions;
  static [getAllProductVariables] = getAllProductVariables;
  static [getPaperClassification] = getPaperClassification;
  static [createResearchers] = createResearchers;
  static [getResearcherHistory] = getResearcherHistory;
  static [decryptPassword] = decryptPassword;

  // gdpr
  static [searchData] = searchData;
  static [deleteData] = deleteData;
  static [createJob] = createJob;
  static [gdprHistory] = gdprHistory;

  // downloads
  static [getAllExports] = getAllExports;

  // fulfilment
  static [getAllFulfilmentHistory] = getAllFulfilmentHistory;
  static [tierOneHistory] = tierOneHistory;
  static [retryFulfilment] = retryFulfilment;
  static [getAllPartners] = getAllPartners;
  static [editPartner] = editPartner;
  static [getAllFulfilmentAPIHistory] = getAllFulfilmentAPIHistory;

  // operations
  static [searchUsers] = searchUsers;
  static [checkUserStatus] = checkUserStatus;
  static [blockOrUnblockUser] = blockOrUnblockUser;
  static [searchLogs] = searchLogs;
  static [getAllLocale] = getAllLocale;
  static [statusUpdate] = statusUpdate;
  static [getLocaleInfo] = getLocaleInfo;
  static [showBlackList] = showBlackList;
  static [addBlackList] = addBlackList;
  static [deleteBlackList] = deleteBlackList;
  static [getSummary] = getSummary;

  // user management
  static [getAllUsers] = getAllUsers;
  static [editUser] = editUser;
  static [deleteUser] = deleteUser;
  static [exportUserList] = exportUserList;
  static [getAllRoles] = getAllRoles;
  static [editRole] = editRole;
  static [deleteRole] = deleteRole;

  static [exportHistory] = exportHistory;
  static [viewHistory] = viewHistory;
  static [refundOrder] = refundOrder;
  static [retryDeActivateCoupons] = retryDeActivateCoupons;
}
