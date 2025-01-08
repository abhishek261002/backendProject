import Router from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {createTweet, editTweet, deleteTweet, getAllTweets , getAllTweetsByUser} from "../controllers/tweet.controller.js"

const router = Router();

router.route("/create-tweet").post(verifyJWT, createTweet)
router.route("/delete-tweet").post(verifyJWT, deleteTweet)
router.route("/edit-tweet").post(verifyJWT, editTweet)
router.route("/get-alltweets").get( getAllTweets)
router.route("/get-alltweetsbyuser").get( verifyJWT, getAllTweetsByUser)



export default router