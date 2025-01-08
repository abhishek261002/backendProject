import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleSubscription, getAllSubscribedChannels } from "../controllers/subscription.controller.js";


const router = Router();

router.route("/c/:channelId/toggle-subscription").post(verifyJWT, toggleSubscription)
router.route("/get-subscribed-channels").get(verifyJWT, getAllSubscribedChannels)


export default router