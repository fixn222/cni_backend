import express, { Router } from "express";
import {
  createApplication,
  contactAdmin,
  deleteUserActivity,
  getApplicationsByUser,
  getUserActivities,
  deleteApplication,
  updateApplication,
} from "../controllers/application.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";

const router = express.Router();

router.get("/", requireAuth, getApplicationsByUser);
router.get("/user", requireAuth, getApplicationsByUser);
router.get("/activities", requireAuth, getUserActivities);
router.post("/", requireAuth, createApplication);
router.post("/create", requireAuth, createApplication);
router.post("/contact-admin", requireAuth, contactAdmin);
router.patch("/:id", requireAuth, updateApplication);
router.delete("/activities/:id", requireAuth, deleteUserActivity);
router.delete("/:id", requireAuth, deleteApplication);

export default router;
