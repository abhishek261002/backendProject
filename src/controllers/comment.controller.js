import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose,{isValidObjectId} from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";

const createCommentOnVideo = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT LOGGED IN/FOUND")
    }
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400,"VIDEO NOT FOUND")
    }
    const {content} = req.body;
    if(!content){
        throw new ApiError(400,"CONTENT FIELD EMPTY")
    }

    const comment =await Comment.create({
        content,
        video: videoId,
        owner: userId
    })
    if(!comment){
        throw new ApiError(400,"ERROR IN CREATING COMMENT DOC")
    }

    return res.status(200)
                .json(new ApiResponse(200,comment,"COMMENTED SUCCESSFULLY"))
})

const editCommentOnVideo = asyncHandler(async(req,res)=>{
    const userId= req.user._id;
    if(!userId){
        throw new ApiError(400,"USER NOT LOGGED IN/FOUND")
    }
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400,"VIDEO NOT FOUND")
    }
    const {commentId, newContent} = req.body;
    if(!commentId || !newContent){
        throw new ApiError(400,"SOME FIELDS MISSING")
    }
    const comment = await Comment.findById(commentId);
    const commentOwner = comment?.owner;
    if(commentOwner?.toString() !== userId?.toString()){
        throw new ApiError(400,"OWNER OF COMMENT NOT MATCHING")
    }
    const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content: newContent
            }
        },
        {new: true}
    )
    if(!updateComment){
        throw new ApiError(400,"ERROR IN UPDATING COMMENT")
    }

    return res.status(200)
                .json(new ApiResponse(200,updateComment?.content,"COMMMENT UPDATED SUCCESSFULLY"))
})

const deleteCommentOnVideo= asyncHandler(async(req,res)=>{
    const userId= req.user._id;
    if(!userId){
        throw new ApiError(400,"USER NOT LOGGED IN/FOUND")
    }
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400,"VIDEO NOT FOUND")
    }
    const {commentId} = req.body;
    if(!commentId){
        throw new ApiError(400,"COMMENT ID NOT RECIEVED")
    }
    const comment = await Comment.findById(commentId);
    const commentOwner = comment?.owner;
    if(commentOwner?.toString() !== userId?.toString()){
        throw new ApiError(400,"OWNER OF COMMENT NOT MATCHING OR COMMENT NOT FOUND")
    }

    const deleteComment = await Comment.deleteOne({
        $and:[{owner: userId},{video: videoId}, {_id: commentId}]
    })
    if(!deleteComment){
        throw new ApiError(400,"ERROR IN DELETING COMMENT")
    }

    return res.status(200)
                .json(new ApiResponse(200,deleteComment, "COMMENT DELETED SUCCESSFULLY"))
})

const getCommentsOnVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"VIDEO NOT FOUND")
    }
    const allCommentsOnVideo = await Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId) 
            }
        },
        {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },    
          {
            $addFields: {
              createdBy: {
                $first: "$createdBy",
              },
            },
          },
          {
            $unwind: "$createdBy",
          },
        {
            $project: {
              content: 1,
              createdBy: 1,
            },
          },
    ])

    if(!allCommentsOnVideo){
        throw new ApiError(400,"COMMENTS ON VIDEOS FOUND OR NO COMMENTS")
    }
    console.log(allCommentsOnVideo);
    return res.status(200)
                .json(new ApiResponse(200,allCommentsOnVideo,"COMMENTS FETCHED SUCCESSFULLY" ))
})


export {createCommentOnVideo , editCommentOnVideo , deleteCommentOnVideo , getCommentsOnVideo}