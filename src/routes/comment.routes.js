import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createCommentOnVideo, editCommentOnVideo ,
         deleteCommentOnVideo, getCommentsOnVideo} from "../controllers/comment.controller.js";
const router = Router();

router.route("/:videoId")
                            .post(verifyJWT, createCommentOnVideo)     // Create a comment
                              // Edit a comment
                             .patch(verifyJWT,editCommentOnVideo)// Delete a comment
                            .get(getCommentsOnVideo);                  // Fetch comments

router.route("/delete").delete(verifyJWT,deleteCommentOnVideo)
// router.route("/edit-comment").post(verifyJWT,editCommentOnVideo)
export default router;