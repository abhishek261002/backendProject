import Router from "express"
import { registerUser, loginUser, logoutUser ,refreshAccessToken ,changeCurrentPassword , updateAccountDetails 
    , updateUserAvatar, updateUserCoverImage ,getUserChannelProfile, getWatchHistory ,getCurrentUser} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"
const router = Router();

router.route("/register").post(
    upload.fields([
        {name: "avatar", 
         maxCount:1,
        }, 
        {name: "coverImage",
            maxCount:1
        }
    ])
    ,registerUser)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT , logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT , changeCurrentPassword)
router.route("/current-user").get(verifyJWT , getCurrentUser)
router.route("/edit-accdetails").post(verifyJWT , updateAccountDetails)
router.route("/edit-useravatar").post(
    verifyJWT,
    upload.single("avatar")
    , updateUserAvatar)

router.route("/edit-usercoverimage").post(
         verifyJWT,
        upload.single("coverImage")
        , updateUserCoverImage)

router.route("/c/:username").get(verifyJWT , getUserChannelProfile)


router.route("/watch-history").get(verifyJWT, getWatchHistory)


export default router;