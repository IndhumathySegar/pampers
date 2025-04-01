import { Router } from "express";
import contentfulController from "./contentful.controller";

import authMiddleware from "../../middlewares/auth";
import aclMiddlware from "../..//middlewares/acl";
import Services from "../../constents/services";
import multer from "multer";

// Set up Multer for file handling
const storage = multer.memoryStorage();// NOSONAR

const upload = multer({ storage });// NOSONAR
const router: Router = Router({ strict: true });

const orHasPermissionMiddleware = (permissions) => {
  return (req, res, next) => {
    // Check if the user has permission for any of the specified permissions
    const hasPermission = permissions.some((permission) =>
      aclMiddlware.hasPermission(permission)
    );

    if (hasPermission) {
      next(); // User has permission, proceed to the next middleware/controller
    } else {
      res.status(403).json({ message: "Permission denied" });
    }
  };
};

router.get(
  ["/contentful/getProjects", "/getProjects"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:migration:createMigration"],
    Services["crmManagement:migration:createMigration"],

    // Add other permissions as needed
  ]),

  contentfulController.getAllProjects
);
router.get(
  ["/contentful/getEnvironments", "/getEnvironments"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:migration:createMigration"],
    Services["crmManagement:migration:createMigration"],

    // Add other permissions as needed
  ]),
  contentfulController.getAllEnvironments
);
router.get(
  ["/contentful/getAllTags", "/getAllTags"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:migration:createMigration"],
    Services["crmManagement:migration:createMigration"],

    // Add other permissions as needed
  ]),
  contentfulController.getAllTags
);
router.get(
  ["/contentful/listMigration", "/listMigration"],
  authMiddleware.requireJWT,

  orHasPermissionMiddleware([
    Services["contentManagement:history:getAllMigrationHistory"],
    Services["contentManagement:rollbackHistory:getRollbackHistory"],
    Services["crmManagement:history:getAllMigrationHistory"],

    // Add other permissions as needed
  ]),
  contentfulController.getAllMigrations
);
router.post(
  ["/contentful/migration", "/migration"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:migration:createMigration"],
    Services["crmManagement:migration:createMigration"],

    // Add other permissions as needed
  ]),
  contentfulController.migrate
);

router.post(
  ["/contentful/migrationRollback", "/migrationRollback"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:createRollback:createRollback"],
    // Add other permissions as needed
  ]),
  contentfulController.migrationRollBack
);

router.post(
  ["/contentful/crm-migration", "/crm-migration"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["crmManagement:migration:createMigration"],

    // Add other permissions as needed
  ]),
  contentfulController.crmMigrate
);

router.post(
  "/contentful/create-locale",
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["localeManagement:create:createLocale"],
    Services["contentManagement:createLocale:createLocale"],
  ]),
  contentfulController.createContentfulLocale
);

router.post(
  "/contentful/get-isocode-list",
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["localeManagement:create:createLocale"],
    Services["contentManagement:createLocale:createLocale"],
  ]),
  contentfulController.getIsoCodeList
);

router.get(
  "/contentful/new-locale-history",
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["localeManagement:history:getLocaleHistory"],
    Services["contentManagement:localeHistory:getLocaleHistory"]
  ]),
  contentfulController.fetchNewLocaleHistory
);

router.get(
  ["/contentful/deeplinks-versions"],
  authMiddleware.requireJWT,

  orHasPermissionMiddleware([
    Services["contentManagement:migration:createMigration"],
    Services["crmManagement:migration:createMigration"],

    // Add other permissions as needed
  ]),
  contentfulController.deepLinksVersions
);
router.get(
  ["/contentful/deeplinks-view"],
  authMiddleware.requireJWT,

  orHasPermissionMiddleware([
    Services["contentManagement:migration:createMigration"],
    Services["crmManagement:migration:createMigration"],

    // Add other permissions as needed
  ]),
  contentfulController.deepLinksView
);
router.post(
  ["/contentful/deeplinks-manage"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:migration:createMigration"],
    Services["crmManagement:migration:createMigration"],

    // Add other permissions as needed
  ]),
  contentfulController.deepLinksManage
);

router.post(
  "/contentful/translate",
  authMiddleware.requireJWT,

  orHasPermissionMiddleware([
    Services["contentManagement:translation:createTranslation"],
    Services["contentManagement:createClone:createClone"],
    Services["crmManagement:translation:createTranslation"],
    Services["contentManagement:reviewer:createTranslation"],

    // Add other permissions as needed
  ]),
  contentfulController.translate
);

router.post(
  "/contentful/updateTranslation",
  authMiddleware.requireJWT,

  orHasPermissionMiddleware([
    Services["contentManagement:translation:createTranslation"],
    Services["contentManagement:createClone:createClone"],
    Services["crmManagement:translation:createTranslation"],

    // Add other permissions as needed
  ]),
  contentfulController.updateTranslation
);

router.get(
  "/contentful/searchTranslation",
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:translationHistory:translationHistory"],
    Services["contentManagement:translation:createTranslation"],
    Services["contentManagement:createClone:createClone"],
    Services["crmManagement:translationHistory:translationHistory"],
    Services["crmManagement:translation:createTranslation"],
    Services["contentManagement:reviewerHistory:reviewerHistory"],
    Services["contentManagement:reviewer:createTranslation"],

    // Add other permissions as needed
  ]),
  contentfulController.searchTranslation
);

router.get(
  "/contentful/fetchContentModel",
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["marketExpantion:translate:translateOrClone"],
    Services["contentManagement:translation:createTranslation"],
    Services["contentManagement:createClone:createClone"],
    Services["crmManagement:translation:createTranslation"],
    Services["contentManagement:cloneTranslate:translateOrClone"]
    // Add other permissions as needed
  ]),

  contentfulController.fetchContentModel
);

router.get(
  "/contentful/fetchMigrationModel",
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["marketExpantion:translate:translateOrClone"],
    Services["contentManagement:translation:createTranslation"],
    Services["contentManagement:createClone:createClone"],
    Services["crmManagement:translation:createTranslation"],

    // Add other permissions as needed
  ]),

  contentfulController.fetchMigrationModel
);


router.post(
  "/contentful/startTranslationJob",
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["marketExpantion:translate:translateOrClone"],
    Services["contentManagement:cloneTranslate:translateOrClone"]
  ]),
  contentfulController.startTranslationJobs
);

router.get(
  ["/contentful/fetchTranslationHistory"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["marketExpantion:history:getAllTranslateHistory"],
    Services["contentManagement:cloneHistory:getAllTranslateHistory"]
  ]),
  contentfulController.fetchTranslationHistory
);


router.get(
  ["/contentful/content-translation-history"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["marketExpantion:history:getAllTranslateHistory"],
    Services["contentManagement:cloneHistory:getAllTranslateHistory"],
    Services["contentManagement:translationHistory:translationHistory"],
    Services["crmManagement:translationHistory:translationHistory"],
    Services["contentManagement:reviewer:reviewerHistory"],
    Services["crmManagement:reviewer:reviewerHistory"],
    // Add other permissions as needed
  ]),

  contentfulController.fetchContentTranslationHistory
);

router.get(
  ["/contentful/content-translation-allhistory"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:translationAllHistory:translationAllHistory"],
    // Add other permissions as needed
  ]),

  contentfulController.fetchContentTranslationAllHistory
);

router.post(
  ["/contentful/update-status"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["marketExpantion:history:getAllTranslateHistory"],
    Services["contentManagement:cloneHistory:getAllTranslateHistory"]
  ]),
  contentfulController.updateStatus
);

router.post(
  "/contentful/submit-reviewer",
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:translation:createTranslation"],
    
    Services["crmManagement:translation:createTranslation"],
    // Add other permissions as needed
  ]),

  contentfulController.submitReviewer
);

router.post(
  "/contentful/approve-messages",
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:translation:createTranslation"],
    Services["contentManagement:createClone:createClone"],
    Services["crmManagement:translation:createTranslation"],
    Services["contentManagement:reviewerHistory:reviewerHistory"],
    // Add other permissions as needed
  ]),

  contentfulController.approveConversations
);





router.post(
  ["/contentful/upload-file"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:migration:createMigration"],
    Services["crmManagement:migration:createMigration"],
  ]),
  upload.fields([{ name: "content", maxCount: 1 }, { name: "media", maxCount: 1 }]),
  contentfulController.bulkMigration
);

router.get(
  ["/contentful/csv-upload-history"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["crmManagement:bulkMigration:bulkMigration"]
 ]),
  contentfulController.fetchBulkMigrationHistory
);

router.get(
  ["/contentful/download-file"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["crmManagement:bulkMigration:bulkMigration"]
 ]),
  contentfulController.downloadFile
);


router.get(
  ["/contentful/generate-token"],
  contentfulController.getGenAiToken
);

router.get(
  ["/contentful/remove-tranlated-content"],
  contentfulController.removeTranslatedData
);

export default router;
