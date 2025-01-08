import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async(req,res)=>{
    //video id ,user id leli user se
    //query if doc already exist in likes collection using both videoid and userid
    //if doesnt exist => create a like video document   
    //if exists unlike video by deleting the document


    const {videoId} = req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"VIDEO NOT FOUND")
    }
    const userId = req.user._id;
    if(!userId){
        throw new ApiError(400,"USER NOT LOGGED IN")
    }
    const likedVideo = await Like.findOne({
         $and : [{ video: videoId},{likedBy : userId}]});

    console.log(likedVideo);
        if(!likedVideo){
            const likeAVideo = await Like.create({
                video: videoId,
                likedBy: userId
            })
            return res.status(200)
                    .json(new ApiResponse(200,likeAVideo, "VIDEO LIKED AND DOC CREATED SUCCESSFULLY"))
        }
    
    //liked hai to unlike karo
    const unlikeVideo = await Like.deleteOne({
        $and : [{ video: videoId},{likedBy : userId}]
    })
    if(!unlikeVideo){
        throw new ApiError(400,"ERROR IN UNLIKING")
    }
    return res.status(200)
                .json(new ApiResponse(200,unlikeVideo, "VIDEO UNLIKED AND DOC DELETED SUCCESSFULLY"))
})

const toggleCommentLike = asyncHandler(async(req,res)=>{
    const {commentId} = req.body;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"COMMENT NOT FOUND")
    }
    const userId = req.user._id;
    if(!userId){
        throw new ApiError(400,"USER NOT LOGGED IN")
    }
    //find likecomment doc through comment id and userid
    const likedComment = await Like.findOne({
        $and:[{comment: commentId},{likedBy: userId}]
    });

    //nhi mila to like karo comment
        if(!likedComment){
            const likeAComment = await Like.create({
                comment:commentId,
                likedBy: userId
            })
            if(!likeAComment){
                throw new ApiError(400,"ERROR IN LIKING A COMMENT OR CREATING LIKE COMMENT DOC")
            }
            return res.status(200)
                    .json(new ApiResponse(200,likeAComment, "LIKE COMMENT DOC CREATED SUCCESSFULLY"))
        }
    //mil gya to unlike karo i.e. DELETE THE DOC
    const unlikeCommment = await Like.deleteOne({
        $and:[{comment: commentId},{likedBy: userId}]
    })
    if(!unlikeCommment){
        throw new ApiError(400,"ERROR IN UNLIKING A COMMENT OR CREATING LIKE COMMENT DOC" )
    }

    return res.status(200)
                    .json(new ApiResponse(200,unlikeCommment, "UNLIKED COMMENT SUCCESSFULLY OR DOC DELETE SUCCESSFULLY"))
})

const toggleTweetLike = asyncHandler(async(req,res)=>{
    const {tweetId} = req.body;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"COMMENT NOT FOUND")
    }
    const userId = req.user._id;
    if(!userId){
        throw new ApiError(400,"USER NOT LOGGED IN")
    }
    //find likecomment doc through comment id and userid
    const likedTweet = await Like.findOne({
        $and:[{tweet: tweetId},{likedBy: userId}]
    });

    //nhi mila to like karo comment
        if(!likedTweet){
            const likeATweet = await Like.create({
                tweet: tweetId,
                likedBy: userId
            })
            if(!likeATweet){
                throw new ApiError(400,"ERROR IN LIKING A TWEET OR CREATING LIKE TWEET DOC")
            }
            return res.status(200)
                    .json(new ApiResponse(200,likeATweet, "LIKE TWEET DOC CREATED SUCCESSFULLY"))
        }
    //mil gya to unlike karo i.e. DELETE THE DOC
    const unlikeTweet = await Like.deleteOne({
        $and:[{tweet: tweetId},{likedBy: userId}]
    })
    if(!unlikeTweet){
        throw new ApiError(400,"ERROR IN UNLIKING A TWEET OR CREATING LIKE TWEET DOC" )
    }

    return res.status(200)
                    .json(new ApiResponse(200,unlikeTweet, "UNLIKED COMMENT SUCCESSFULLY OR DOC DELETE SUCCESSFULLY"))
})

const getAllLikedVideoByUser = asyncHandler(async(req,res)=>{
   const userId = req.user._id;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT LOGGED INN")
    }
    const AllLikedVideos = await Like.aggregate([
        {
        $match: {
          video: { $exists: true },
          likedBy: new mongoose.Types.ObjectId(userId)
        }
        },
        {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "video",
          "pipeline":[
                    {
                        $project:{
                                owner:1,
                                thumbnail:1,
                                title:1,
                                views:1,
                                createdAt:1
                        }
                        },
                    ]
        }
        },
        {
        $addFields: {
          video:{
            $first:"$video"
          },
         
        }
        }, 
        {
        $lookup: {
          from: "users",
          localField: "video.owner", // Use the `owner` field from the `video` object
          foreignField: "_id", // Match it with the `_id` in the `users` collection
          as: "ownerDetails",
          "pipeline":[
            {
            $project:{
                        avatar:1,
                        username:1,
                        fullName:1
                        }
            }
               ]
                }
       }
     ,
       {
        $project: {
          video:1,
          ownerDetails:{
                    $first: "$ownerDetails"
                    }
        }
      },
    ])

    if(!AllLikedVideos){
        throw new ApiError(400,"LIKED VIDEOS NOT FOUND")
    }
    console.log(AllLikedVideos);
    return res.status(200)
                .json(new ApiResponse(200,AllLikedVideos, "LIKED VIDEOS FETCHED SUCCESSFULLY"))
})


export {
    getAllLikedVideoByUser,
    toggleVideoLike,
   toggleCommentLike,
    toggleTweetLike
}