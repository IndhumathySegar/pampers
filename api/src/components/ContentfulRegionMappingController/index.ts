import { Router } from "express";
import RegionMappingController from "./contentful-region-mapping.controller";

import authMiddleware from "../../middlewares/auth";
import aclMiddlware from "../../middlewares/acl";
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
  ["/region-mapping/create-region-mapping", "/createRegionMapping"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:createRegion:createRegion"],
    Services["contentManagement:createRegion:createRegion"],

    // Add other permissions as needed
  ]),
  RegionMappingController.createRegionMapping
);

router.get(
  ["/region-mapping/get-region-mapping", "/getRegionMapping"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["contentManagement:regionHistory:getRegionHistory"],
    Services["contentManagement:regionHistory:getRegionHistory"],

    // Add other permissions as needed
  ]),
  RegionMappingController.getRegionMapping
);





export default router;
