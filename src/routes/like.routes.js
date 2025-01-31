import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {toggleVideoLike, getAllLikedVideoByUser, toggleCommentLike
    ,toggleTweetLike
} from "../controllers/like.controller.js"

const router= Router();

router.route("/video").post(verifyJWT , toggleVideoLike)
router.route("/c/:videoId/toggle-like-comment").post(verifyJWT , toggleCommentLike)
router.route("/get-likedVideos").get(verifyJWT, getAllLikedVideoByUser)
router.route("/toggle-like-tweet").post(verifyJWT , toggleTweetLike)

export default router