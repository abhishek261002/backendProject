import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose,{isValidObjectId} from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {User} from "../models/user.model.js"
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Subscription } from "../models/subscriptions.model.js";

const getChannelStats = asyncHandler(async(req,res)=>{
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT LOGGED IN")
    }
    const videoStats = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group:{
                _id: "$owner",
                totalVideos:{
                    $count: {}
                },
                totalViews: {
                    $sum : "$views",
                }
            }
        }
    ])

    const likeStats = await Like.aggregate([
        {
            $match:{
                likedBy : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group:{
                _id :"$likedBy",
                totalLikes:{
                    $count: {}
                }
            }
        }
    ])

    const subsriberStats = await Subscription.aggregate([
        {
            $match:{
                channel : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group:{
                _id: "$channel",
                totalSubscribers : {
                    $count: {}
                }
            }
        }
    ])

    if(!videoStats || !likeStats || !subsriberStats){
        throw new ApiError(400,"ERROR IN FETCHING CHANNEL STATS")
    }
    
    const info = {
        owner: userId,
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews : videoStats[0]?.totalViews || 0,
        totalLikes : likeStats[0]?.totalLikes || 0,
        totalSubscribers : subsriberStats[0]?.totalSubscribers || 0
    }

    if(!info){
        throw new ApiError(400,"ERROR IN FETCHING CHANNEL STATS")
    }

    return res.status(200)
                .json(new ApiResponse(200,info,"CHANNEL STATS FECTHED SUCCESSFULLT"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT LOGGED IN")
    }
    const videos = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $project: {
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          duration: 1,
          views: 1,
          isPublished: 1,
          owner: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);
    
    if(!videos){
        throw new ApiError(400,"ERROR IN FETCHING VIDEOS")
    }

    return res
      .status(200)
      .json(new ApiResponse(200, videos, "Channel Videos Fetched"));
  });


export {
    getChannelStats,
    getChannelVideos
}
