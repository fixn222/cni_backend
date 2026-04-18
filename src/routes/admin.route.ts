import express from "express";

import {
  createAdminCountry,
  deleteAdminActivity,
  deleteAdminApplication,
  deleteAdminCountry,
  deleteUser,
  getAdminApplications,
  sendApplicationEmail,
  updateUserRole,
  updateAdminApplicationStatus,
} from "../controllers/admin.controller.ts";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware.ts";

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.get("/applications", getAdminApplications);
router.patch("/applications/:id/status", updateAdminApplicationStatus);
router.delete("/applications/:id", deleteAdminApplication);
router.post("/countries", createAdminCountry);
router.delete("/countries/:id", deleteAdminCountry);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);
router.post("/send-email", sendApplicationEmail);
router.delete("/activities/:id", deleteAdminActivity);

export default router;
