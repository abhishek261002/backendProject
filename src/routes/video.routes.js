import Router from "express"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { uploadNewVideo, deleteExistingVideo , editExistingVideo ,getVideoToStream} from "../controllers/video.controller.js";

const router = Router();

router.route("/video-upload").post(verifyJWT,
    upload.fields([
        {name: "videoFile", 
         maxCount:1,
        }, 
        {name: "thumbnail",
            maxCount:1
        }
    ]),
    uploadNewVideo
)

router.route("/video-delete").post(verifyJWT, deleteExistingVideo)

router.route("/edit-video").post(
    verifyJWT,
    upload.single("newThumbnail"),
    editExistingVideo
)
router.route("/stream-video").post(getVideoToStream)
export default router