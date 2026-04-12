import express ,{Router} from "express";
import { createApplication } from "../controllers/application.controller.ts";

const router = express.Router();


router.post("/create" , createApplication)


export default router;