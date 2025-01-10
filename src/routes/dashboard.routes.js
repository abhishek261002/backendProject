import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getChannelStats ,getChannelVideos } from "../controllers/dashboard.controller.js";

const router= Router();

router.route("/channel-stats").get(verifyJWT , getChannelStats)
router.route("/channel-videos").get(verifyJWT , getChannelVideos)

export default router