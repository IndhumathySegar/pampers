import { Router } from "express";
import AdminPanelController from "./admin-panel.controller";

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

router.get(
  ["/admin-panel/auditTrailHistory"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["adminPanel:auditTrail:auditTrail"]]
  ),
  AdminPanelController.fetchAuditTrailHistory
);

router.get(
  ["/admin-panel/getAllDropdown"],
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["adminPanel:auditTrail:auditTrail"]]
  ),
  AdminPanelController.fetchAuditFilterDropdownData
);

router.get(
  ["/admin-panel/getExportData"], 
  authMiddleware.requireJWT,
  orHasPermissionMiddleware([
    Services["adminPanel:auditTrail:auditTrail"]]
  ),
  AdminPanelController.getExportData
);

export default router;
