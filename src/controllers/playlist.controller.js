import mongoose,{isValidObjectId} from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT FOUND")
    }
    const {name, description} = req.body;
    if(!name || !description){
        throw new ApiError(400,"SOME FIELD MISSING")
    }
    const existingPlaylist = await Playlist.findOne({
        $and: [{ name: name }, { owner: userId }],
      });
    
      if (existingPlaylist) {
        throw new ApiError(400, "Playlist with this name already exists");
      }
      
    const playlist = await Playlist.create({
        name,
        owner: userId,
        description
    })
    if(!playlist){
        throw new ApiError(400,"PLAYLIST NOT CREATED")
    }

    return res.status(200)
                .json(new ApiResponse(200,playlist,"PLAYLIST CREATED SUCCESSFULLY"))
})

const deletePlaylist = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT FOUND")
    }
    const {playlistId} =  req.body;
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400,"PLAYLIST NOT FOUND")
    }

    const deletingPlaylist = await Playlist.findOneAndDelete(
        {owner :userId, _id:playlistId}
    )

    if(!deletingPlaylist){
        throw new ApiError(400,"ERROR IN DELETING PLAYLIST")
    }
    return res.status(200)
                .json(new ApiResponse(200,{},"PLAYLIST DELETED SUCCESSFULLY"))
})

const updatePlaylist = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT FOUND")
    }
    const {playlistId} = req.params || req.body;
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400,"PLAYLIST NOT FOUND")
    }
    const {name, description} = req.body;
    if(!name || !description){
        throw new ApiError(400,"SOME FIELDS ARE MISSING")
    }
    const updatingPlaylist = await Playlist.findOneAndUpdate(
        {owner:userId, _id: playlistId},
        {
            $set:{
                name,
                description
            }
        },
        {new : true}
    )
    if(!updatingPlaylist){
        throw new ApiError(400,"ERROR IN UPDATING PLAYLIST") 
    }

    return res.status(200)
                .json(new ApiResponse(200,updatingPlaylist,"PLAYLIST UPDATED SUCCESSFULLY"))
})

const addVideoToPlaylist = asyncHandler(async(req,res)=>{

    const userId = req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT FOUND")
    }
    const {videoId} = req.body;
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"VIDEO NOT FOUND")
    }
    const {playlistId} = req.params;
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400,"PLAYLIST NOT FOUND")
    }
  
    const playlist = await Playlist.findOne({ _id: playlistId, owner: userId });
    if (!playlist) {
        throw new ApiError(400, "PLAYLIST NOT FOUND");
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "VIDEO ALREADY EXISTS IN THE PLAYLIST");
    }

    playlist.videos.push(videoId);
    await playlist.save({validateBeforeSave: false});
    
    return res.status(200)
                .json(new ApiResponse(200,playlist,"VIDEO ADDED TO THE PLAYLIST SUCCESSFULLY"))
})

const removeVideoFromPlaylist = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT FOUND")
    }
    const {videoId} = req.body;
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"VIDEO NOT FOUND")
    }
    const {playlistId} = req.params;
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400,"PLAYLIST NOT FOUND")
    }
    const updatePlaylist = await Playlist.findOneAndUpdate(
        {_id: playlistId , owner: userId},
        {
            $pull: {
                videos: videoId
            }
        },
        {new : true}
    )
    if(!updatePlaylist){
        throw new ApiError(400,"ERROR IN DELETING VIDEO FROM PLAYLIST")
    }

    return res.status(200)
            .json(new ApiResponse(200,updatePlaylist,"VIDEO REMOVED FROM PLAYLIST SUCCESSFULLY "))
})

const getUserPlaylists = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT FOUND")
    }
    const allPlaylistsMadeByUser = await Playlist.find({owner: userId});
    if(!allPlaylistsMadeByUser){
        throw new ApiError(400,"PLAYLISTS NOT FOUND OR NO PLAYLIST MADE BY USER")
    }

    return res.status(200)
                .json(new ApiResponse(200,allPlaylistsMadeByUser,"PLAYLISTS FETCHED SUCCESSFULLY"))
})

const getPlaylistById = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT FOUND")
    }
    const {playlistId} = req.params;
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400,"PLAYLIST NOT FOUND")
    }
    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(playlistId),
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "allVideosInPlaylist",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner_details",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        avatar:1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project:{
                            owner_details:{
                                $first: "$owner_details"
                            },
                            title:1,
                            thumbnail:1,
                            duration:1,
                            views:1,
                            isPublished:1,
                            createdAt:1
                        }
                    }
                ]
            }
        },
        {
            $project:{
                allVideosInPlaylist:1,
                name:1,
                description:1,
                createdAt:1
            }
        }  
    ])

   
    if(!playlist){
        throw new ApiError(400,"ERROR IN FETCHING VIDEOS IN PLAYLIST OR PLAYLIST NOT FOUND")
    }

    return res.status(200)
                .json(new ApiResponse(200,playlist,"PLAYLIST FETCHED SUCCESSFULLY"))
})

export {addVideoToPlaylist, createPlaylist, removeVideoFromPlaylist , deletePlaylist,
    updatePlaylist, getUserPlaylists, getPlaylistById
}

// createPlaylist,
//   getUserPlaylists,
//   getPlaylistById,
//   addVideoToPlaylist,
//   removeVideoFromPlaylist,
//   deletePlaylist,
//   updatePlaylist,