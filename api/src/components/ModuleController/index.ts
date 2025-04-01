import { Router } from "express";
import moduleController from "./module.controller";

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
  ["/module/getList", "/getList"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:migration:createMigration"],
    Services["crmManagement:migration:createMigration"],

    // Add other permissions as needed
  ]),
  moduleController.getList
);

router.get(
    ["/module/getRegion", "/getRegion"],
    authMiddleware.requireJWT,
 
    moduleController.getRegion
  );

  router.get(
    ["/module/getUserRegion", "/getUserRegion"],
    authMiddleware.requireJWT,
 
    moduleController.getUserRegion
  );


export default router;
