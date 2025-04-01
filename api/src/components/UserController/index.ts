import { Router } from "express";

import userController from "./user.controller";

import authMiddleware from "../../middlewares/auth";
import aclMiddleware from "../../middlewares/acl";
import Services from "../../constents/services";

const router: Router = Router({ strict: true });

router.get("/users/:id", authMiddleware.requireJWT, userController.getUserById);
router.get("/users", authMiddleware.requireJWT, aclMiddleware.hasPermission(Services["adminPanel:users:getAllUsers"]), userController.getUsers);
router.post("/users", authMiddleware.requireJWT, aclMiddleware.hasPermission(Services["adminPanel:users:editUser"]), userController.createUser);
router.patch("/users/:id", authMiddleware.requireJWT, aclMiddleware.hasPermission(Services["adminPanel:users:editUser"]), userController.updateUser);
router.delete("/users/:id", authMiddleware.requireJWT, aclMiddleware.hasPermission(Services["adminPanel:users:deleteUser"]), userController.deleteUser);
router.get("/users/export/getExportData", authMiddleware.requireJWT, aclMiddleware.hasPermission(Services["adminPanel:users:exportUserList"]), userController.getExportData);
router.get("/users/getDropdown", authMiddleware.requireJWT, aclMiddleware.hasPermission(Services["adminPanel:users:getAllUsers"]), userController.fetchUserFilterDropdownData);
router.post("/users/deleteUser", authMiddleware.requireJWT, aclMiddleware.hasPermission(Services["adminPanel:users:deleteUser"]), userController.deleteUser);
router.post("/users/checkEmailExists", authMiddleware.requireJWT, aclMiddleware.hasPermission(Services["adminPanel:users:editUser"]), userController.checkEmailExist);
router.post("/users/updateTC", authMiddleware.requireJWT, userController.updateTermsAndCondition);
router.get("/getTCStatus/:id", authMiddleware.requireJWT, userController.getTCStatus);

export default router;
