import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {addVideoToPlaylist , createPlaylist, removeVideoFromPlaylist,
    deletePlaylist, getPlaylistById, getUserPlaylists, updatePlaylist
} from "../controllers/playlist.controller.js"

const router= Router();

router.route("/create-playlist").post(verifyJWT, createPlaylist)
router.route("/delete-playlist").post(verifyJWT, deletePlaylist)
router.route("/edit-playlist").post(verifyJWT, updatePlaylist)
router.route("/add-video-playlist").post(verifyJWT, addVideoToPlaylist)
router.route("/c/:playlistId/remove-video-playlist").post(verifyJWT, removeVideoFromPlaylist)
router.route("/c/:playlistId/get-playlist").get(verifyJWT, getPlaylistById)
router.route("/get-userplaylists").get(verifyJWT, getUserPlaylists)

export default router;