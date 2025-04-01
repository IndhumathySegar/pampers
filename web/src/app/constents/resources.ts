const cloneConfig = "configManagement:clone:cloneConfig";
const updateConfig = "configManagement:config:updateConfig";
const rollbackConfig = "configManagement:history:rollbackConfig";
const getConfig = "configManagement:config:getConfig";
const getConfigHistory = "configManagement:history:getConfigHistory";

const createLocale = "contentManagement:createLocale:createLocale";
const getLocaleHistory = "contentManagement:localeHistory:getLocaleHistory";

const createRegion = "contentManagement:createRegion:createRegion";
const getRegionHistory = "contentManagement:regionHistory:getRegionHistory";

const createClone = "contentManagement:createClone:createClone";
const getCloneHistory = "contentManagement:cloneHistory:cloneHistory";

const appCloneTranslate = "contentManagement:cloneTranslate:translateOrClone";
const appCloneTranslateHistory = "contentManagement:cloneHistory:getAllTranslateHistory";

const translateOrClone = "marketExpantion:translate:translateOrClone";
const getAllTranslateHistory = "marketExpantion:history:getAllTranslateHistory";

const generateCode = "codeGeneration:generator:generateCode";
const exportCode = "codeGeneration:export:exportCodes";
const getHistory = "codeGeneration:history:getHistory";
const codeUpdate = "codeGeneration:codeUpdate:codeUpdateProcess";
const opsView = "codeGeneration:opsView:getOpsView";
const activationHistory =
  "codeGeneration:activationHistory:getActivationHistory";

// gdpr
const getAllDataExtraction = "gdpr:dataExtraction:getAllData";
const extractData = "gdpr:dataExtraction:searchData";
const dataDeletion = "gdpr:dataDeletion:searchData";
const dataHistory = "gdpr:dataHistory:getHistory";

const codeSearch = "codeSearch:searchCode:getCodeData";
const migrateCreationData = "contentManagement:migration:createMigration";
const migrationHistoryData = "contentManagement:history:getAllMigrationHistory";
const translationCreationData = "contentManagement:translation:createTranslation";
const translationHistoryData = "contentManagement:translationHistory:translationHistory";
const translationAllHistoryData = "contentManagement:translationAllHistory:translationAllHistory";

const createRollback = "contentManagement:createRollback:createRollback";
const getRollbackHistory = "contentManagement:rollbackHistory:getRollbackHistory";


const marketTranslationCreation = "marketManagement:translation:createTranslation";
const marketTranslationHistory = "marketManagement:translationHistory:translationHistory";

const crmBulkMigrateData = "crmManagement:bulkMigration:bulkMigration";
const crmMigrateCreationData = "crmManagement:migration:createMigration";
const crmMigrationHistoryData = "crmManagement:history:getAllMigrationHistory";
const crmTranslationCreationData = "crmManagement:translation:createTranslation";
const crmTranslationHistoryData = "crmManagement:translationHistory:translationHistory";
const reviewerTranslate = "contentManagement:reviewer:createTranslation";
const reviewerHistory = "contentManagement:reviewerHistory:reviewerHistory";
const crmReviewerTranslate = "crmManagement:reviewer:createTranslation";
const crmReviewerHistory = "crmManagement:reviewerHistory:reviewerHistory";
const getAllTransactionsData = "diaperfitfinder:transactions:getAllTransactions";
const exportTransactionsData = "diaperfitfinder:transactions:exportTransactions";
const getAllProductVariablesData =
  "diaperfitfinder:productVariables:getAllProductVariables";
const getPaperClassificationData =
  "diaperfitfinder:paperClassification:getPaperClassification";
const createResearchersData = "diaperfitfinder:createResearchers:createResearchers";
const getResearcherHistoryData = "diaperfitfinder:researchersHistory:getHistory";
const decryptPasswordData = "diaperfitfinder:researchersPassword:decryptPassword";
const getAllExportsData = "downloads:exports:getAllExports";
const getAllFulfilmentHistoryData = "fulfilment:history:getAllFulfilmentHistory";
const tierOneHistoryData = "fulfilment:tierOneHistory:tierOneHistory";
const retryFulfilmentData = "fulfilment:tierOneHistory:retryFulfilment";

const editUser = "adminPanel:users:editUser";
const deleteUser = "adminPanel:users:deleteUser";
const exportUserList = "adminPanel:users:exportUserList";
const editRole = "adminPanel:roles:editRole";
const deleteRole = "adminPanel:roles:deleteRole";
const exportHistory = "reconciliation:orderHistory:exportHistory";
const viewHistory = "reconciliation:orderHistory:viewHistory";
const refundOrder = "reconciliation:orderHistory:refundOrder";


const getAllPartners = "fulfilment:partnerManagement:getAllPartners";
const editPartner = "fulfilment:partnerManagement:editPartner";
const getAllFulfilmentAPIHistory =
  "fulfilment:fulfilmentApiHistory:getAllFulfilmentAPIHistory";

  const adminPanelAuditData = "adminPanel:auditTrail:auditTrail";
  const adminPanelUserData = "adminPanel:users:getAllUsers";
  const adminPanelRoleData = "adminPanel:roles:getAllRoles";

export class Resources {
  static businessOperations = "businessOperations";
  static codeGeneration = "codeGeneration";
  static codeSearch = "codeSearch";
  static contentManagement = "contentManagement";
  static crmManagement = "crmManagement";
  static diaperfitfinder = "diaperfitfinder";
  static configManagement = "configManagement";
  static localeManagement = "localeManagement";
  static marketExpantion = "marketExpantion";
  static downloads = "downloads";
  static fulfilment = "fulfilment";
  static operations = "operations";
  static userManagement = "userManagement";
  static reconciliation = "reconciliation";
  static gdpr = "gdpr";
  static settings = "settings";
  static marketReview = "marketManagement"
  static adminPanel = "adminPanel";
}

export class ParentRoute {
  static codeGeneration = "code-generator";
  static codeSearch = "code-search";
  static contentManagement = "contentful";
  static crmManagement = "crm";

  static downloads = "downloads";
  static fulfilment = "fulfilment";
  static operations = "operations";
  static userManagement = "user-management";
  static gdpr = "gdpr";
  static configManagement = "config-management";
  static localeManagement = "locale-management";
  static settings = "settings";
  static marketExpantion = "contentful/contentful-market-expansion";
  static marketManagement = "market-review";
  static adminPanel = "admin-panel/users";
  static adminPanelAudit = "admin-panel";

  // display name
  static codeGenerationDisplay = "Code Generator";
  static codeSearchDisplay = "Code Search";
  static contentManagementDisplay = "Content Management";
  static crmManagementDisplay = "CRM Management";

  static marketExpantionDisplay = "Market Expansion";
  static marketManagementDisplay = "Market Review";


  static diaperfitfinderDisplay = "Diaper Fit Finder";
  static downloadsDisplay = "Downloads";
  static configManagementDisplay = "Config Management";
  static localeManagementDisplay = "Locale Management";
  static fulfilmentDisplay = "Fulfilment";
  static operationsDisplay = "Operations";
  static userManagementDisplay = "User Management";
  static reconciliation = "reconciliation";
  static gdprDisplay = "GDPR";
  static settingsDisplay = "Settings";
  static marketReview = "market-review";
  static adminPanelDisplay = "Admin Panel";

}

export class Services {
  // config management
  static [updateConfig] = updateConfig;
  static [cloneConfig] = cloneConfig;
  static [getConfig] = getConfig;
  static [getConfigHistory] = getConfigHistory;
  static [rollbackConfig] = rollbackConfig;

  static [createLocale] = createLocale;
  static [getLocaleHistory] = getLocaleHistory;

  static [createRegion] = createRegion;
  static [getRegionHistory] = getRegionHistory;
  
  static [createRollback] = createRollback;
  static [getRollbackHistory] = getRollbackHistory;

  static [createClone] = createClone;
  static [getCloneHistory] = getCloneHistory;

  static [appCloneTranslate] = appCloneTranslate;
  static [appCloneTranslateHistory] = appCloneTranslateHistory;
  
  static [translateOrClone] = translateOrClone;
  static [getAllTranslateHistory] = getAllTranslateHistory;

  // code generation
  static [generateCode] = generateCode;
  static [exportCode] = exportCode;
  static [getHistory] = getHistory;
  static [codeUpdate] = codeUpdate;
  static [opsView] = opsView;
  static [activationHistory] = activationHistory;

  //gdpr
  static [getAllDataExtraction] = getAllDataExtraction;
  static [extractData] = extractData;
  // static [dataSearch] = dataSearch;
  static [dataDeletion] = dataDeletion;
  static [dataHistory] = dataHistory;
  // code search
  static [codeSearch] = codeSearch;

  // content migration
  static [migrateCreationData] = migrateCreationData;
  static [migrationHistoryData] = migrationHistoryData;
  static [translationCreationData] = translationCreationData;
  static [translationHistoryData] = translationHistoryData;
  static [translationAllHistoryData] = translationAllHistoryData;
  static [reviewerTranslate] = reviewerTranslate;
  static [reviewerHistory] = reviewerHistory;
  

  // crm migration
  static [crmMigrateCreationData] = crmMigrateCreationData;
  static [crmMigrationHistoryData] = crmMigrationHistoryData;
  static [crmTranslationCreationData] = crmTranslationCreationData;
  static [crmTranslationHistoryData] = crmTranslationHistoryData;
  static [crmReviewerTranslate] = crmReviewerTranslate;
  static [crmReviewerHistory] = crmReviewerHistory;
  static [crmBulkMigrateData] = crmBulkMigrateData;
  
  //market review
  static [marketTranslationCreation] = marketTranslationCreation;
  static [marketTranslationHistory] = marketTranslationHistory;



  // diaper fit finder
  static [getAllTransactionsData] = getAllTransactionsData;
  static [exportTransactionsData] = exportTransactionsData;
  static [getAllProductVariablesData] = getAllProductVariablesData;
  static [getPaperClassificationData] = getPaperClassificationData;
  static [createResearchersData] = createResearchersData;
  static [getResearcherHistoryData] = getResearcherHistoryData;
  static [decryptPasswordData] = decryptPasswordData;

  // downloads
  static [getAllExportsData] = getAllExportsData;

  // fulfilment
  static [getAllFulfilmentHistoryData] = getAllFulfilmentHistoryData;
  static [tierOneHistoryData] = tierOneHistoryData;
  static [retryFulfilmentData] = retryFulfilmentData;
  static [getAllPartners] = getAllPartners;
  static [editPartner] = editPartner;
  static [getAllFulfilmentAPIHistory] = getAllFulfilmentAPIHistory;

  // operations


  // user management
  static [editUser] = editUser;
  static [deleteUser] = deleteUser;
  static [exportUserList] = exportUserList;
  static [editRole] = editRole;
  static [deleteRole] = deleteRole;

  static [exportHistory] = exportHistory;
  static [viewHistory] = viewHistory;
  static [refundOrder] = refundOrder;

  // admin panel
  static [adminPanelAuditData] = adminPanelAuditData;
  static [adminPanelUserData] = adminPanelUserData;
  static [adminPanelRoleData] = adminPanelRoleData;

}
