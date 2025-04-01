import { Router } from "express";
import roleController from "./role.controller";

import authMiddleware from "../../middlewares/auth";
import aclMiddleware from "../../middlewares/acl";
import Services from "../../constents/services";

const router: Router = Router();

router.get(
  "/roles",
  authMiddleware.requireJWT,
  aclMiddleware.hasPermission(Services["adminPanel:roles:getAllRoles"]),
  roleController.getAllRoles
);
router.post(
  "/roles",
  authMiddleware.requireJWT,
  aclMiddleware.hasPermission(Services["adminPanel:roles:editRole"]),
  roleController.createOrEditRole
);
router.post(
  "/roles/deleteRole",
  authMiddleware.requireJWT,
  aclMiddleware.hasPermission(Services["adminPanel:roles:deleteRole"]),
  roleController.deleteRole
);

router.post("/roles/checkRoleExists", authMiddleware.requireJWT, aclMiddleware.hasPermission(Services["adminPanel:roles:editRole"]), roleController.checkRoleExist);

export default router;
