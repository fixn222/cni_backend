import   express ,{ Router }from "express";
import { createFeedback, getFeedbacks } from "../controllers/feedback.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";

const router = express.Router();

router.get("/", requireAuth ,getFeedbacks);

router.post("/create" , requireAuth , createFeedback)

export default router
