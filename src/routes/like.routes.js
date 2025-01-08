import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {toggleVideoLike, getAllLikedVideoByUser, toggleCommentLike
    ,toggleTweetLike
} from "../controllers/like.controller.js"

const router= Router();

router.route("/c/:videoId").post(verifyJWT , toggleVideoLike)
router.route("/c/:videoId/like-comment").post(verifyJWT , toggleCommentLike)
router.route("/get-likedVideos").post(verifyJWT, getAllLikedVideoByUser)

export default router