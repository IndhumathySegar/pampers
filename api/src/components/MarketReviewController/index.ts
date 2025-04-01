import { Router } from "express";
import MarketReviewController from "./market-review.controller";

import authMiddleware from "../../middlewares/auth";
import aclMiddlware from "../..//middlewares/acl";
import Services from "../../constents/services";

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
  "/market-review/updateContentful",
  authMiddleware.requireJWT,

  orHasPermissionMiddleware([
    Services["contentManagement:translation:createTranslation"],
    Services["contentManagement:createClone:createClone"],
    Services["crmManagement:translation:createTranslation"],

    // Add other permissions as needed
  ]),
  MarketReviewController.updateTranslation
);

router.post(
  "/market-review/fetchContentModel",
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["marketManagement:translation:createTranslation"],

    // Add other permissions as needed
  ]),

  MarketReviewController.fetchContentModel
);

router.get(
  "/market-review/fetchRegion",
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["marketManagement:translation:createTranslation"],

    // Add other permissions as needed
  ]),

  MarketReviewController.fetchRegion
);

router.get(
  ["/market-review/fetchContentTranslationHistory"],
  authMiddleware.requireJWT,
  aclMiddlware.hasPermission(
    Services["marketManagement:translationHistory:translationHistory"]
  ),
  MarketReviewController.fetchContentTranslationHistory
);

export default router;
