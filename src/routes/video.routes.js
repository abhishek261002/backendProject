import Router from "express"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { uploadNewVideo, deleteExistingVideo , editExistingVideo 
    ,getVideoToStream, listAllVideosOfChannel, addVideoToWatchHistory
    ,togglePublishStatus, getAllVideos} from "../controllers/video.controller.js";

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
router.route("/:videoId").post(getVideoToStream)
router.route("/all-videos").get(getAllVideos)
router.route("/c/:username").get( listAllVideosOfChannel)
router.route("/watch-history").post(verifyJWT,addVideoToWatchHistory)
router.route("/toggle-ispublished").post(verifyJWT,  togglePublishStatus)
export default router