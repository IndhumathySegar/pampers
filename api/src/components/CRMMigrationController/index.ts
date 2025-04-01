import { Router } from "express";
import CRMMigrationController from "./crm-migration.controller";

import authMiddleware from "../../middlewares/auth";
import aclMiddlware from "../..//middlewares/acl";
import Services from "../../constents/services";

// Set up Multer for file handling

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

router.post(
  ["/crm-contentful/crm-migration", "/crm-migration"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["crmManagement:migration:createMigration"],

    // Add other permissions as needed
  ]),
  CRMMigrationController.crmMigrate
);

router.get(
  "/crm-contentful/searchCrmTranslation",
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
  CRMMigrationController.searchCrmTranslation
);

router.get(
  ["/crm-contentful/getCrmEnvironments", "/getCrmEnvironments"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:migration:createMigration"],
    Services["crmManagement:migration:createMigration"],

    // Add other permissions as needed
  ]),
  CRMMigrationController.getAllCrmEnvironments
);

router.get(
  ["/crm-contentful/content-translation-history"],
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

  CRMMigrationController.fetchCrmContentTranslationHistory
);

router.post(
  "/crm-contentful/updateTranslation",
  authMiddleware.requireJWT,

  orHasPermissionMiddleware([
    Services["contentManagement:translation:createTranslation"],
    Services["contentManagement:createClone:createClone"],
    Services["crmManagement:translation:createTranslation"],

    // Add other permissions as needed
  ]),
  CRMMigrationController.updateCRMTranslation
);

router.post(
  "/crm-contentful/approve-messages",
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:translation:createTranslation"],
    Services["contentManagement:createClone:createClone"],
    Services["crmManagement:translation:createTranslation"],
    Services["contentManagement:reviewerHistory:reviewerHistory"],
    // Add other permissions as needed
  ]),

  CRMMigrationController.approveCrmConversations
);

export default router;
