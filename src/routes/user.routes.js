import Router from "express"
import { registerUser, loginUser, logoutUser ,refreshAccessToken ,changeCurrentPassword , updateAccountDetails , updateUserAvatar, updateUserCoverImage} from "../controllers/user.controller.js";
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
export default router;
router.route("/edit-accdetails").post(verifyJWT , updateAccountDetails)
router.route("/edit-useravatar").post(
    upload.single("avatar")
    ,verifyJWT , updateUserAvatar)

router.route("/edit-usercoverimage").post(
        upload.single("coverImage")
        ,verifyJWT , updateUserCoverImage)