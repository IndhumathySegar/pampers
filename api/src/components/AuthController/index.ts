import { Router } from "express";

import authController from "./auth.controller";
import authMiddleware from "../../middlewares/auth";

const router: Router = Router({ strict: true });

router.post("/auth/login", authController.isUserActive, authMiddleware.signJWTForUser);
router.post("/auth/loginSSO", authMiddleware.validateSSO, authController.isUserActive, authMiddleware.signJWTForUser);
router.post("/auth/password/reset", authMiddleware.verifyOtp, authMiddleware.changePassword);
router.get("/auth/logout", authMiddleware.requireJWT, authController.logOut);

export default router;
