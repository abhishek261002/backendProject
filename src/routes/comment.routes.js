import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createCommentOnVideo, editCommentOnVideo ,
         deleteCommentOnVideo, getCommentsOnVideo} from "../controllers/comment.controller.js";
const router = Router();

router.route("/c/:videoId/create-comment").post(verifyJWT, createCommentOnVideo)
router.route("/c/:videoId/edit-comment").post(verifyJWT, editCommentOnVideo)
router.route("/c/:videoId/delete-comment").post(verifyJWT, deleteCommentOnVideo)
router.route("/c/:videoId/delete-comment").post(verifyJWT, deleteCommentOnVideo)
router.route("/c/:videoId/get-comments").post( getCommentsOnVideo)
export default router;