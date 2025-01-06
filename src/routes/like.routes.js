import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {toggleVideoLike} from "../controllers/like.controller.js"

const router= Router();

router.route("/c/:videoId").post(verifyJWT , toggleVideoLike)


export default router