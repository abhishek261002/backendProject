import mongoose,{isValidObjectId} from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Tweet} from "../models/tweet.model.js"

const createTweet = asyncHandler(async(req,res)=>{
    const userId= req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT FOUND")
    }
    const {content} = req.body;
    if(!content){
        throw new ApiError(400,"CONTENT FIELD MISSING")
    }
    const tweet = await Tweet.create({
        content,
        owner: userId
    })
    if(!tweet){
        throw new ApiError(400,"ERROR IN CREATING TWEET")
    }

    return res.status(200)
                .json(new ApiResponse(200,tweet,"TWEETED SUCCESSFULLY"))
})

const deleteTweet = asyncHandler(async(req,res)=>{
    const userId= req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT FOUND")
    }
    const {tweetId} = req.body;
    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400,"TWEET ID NOT VALID OR RECEIVED")
    }
    const tweet = await Tweet.findOne({
        $and:[{_id:tweetId},{owner: userId}]
    });
    const tweetOwner = tweet?.owner;
    if(tweetOwner?.toString() !== userId.toString()){
        throw new ApiError(400,"OWNER OF TWEET NOT MATCHED")
    }
    const deleteTweet = await Tweet.deleteOne({
        $and:[{_id:tweetId},{owner: userId}]
    })
    if(!deleteTweet){
        throw new ApiError(400,"ERROR IN DELETING TWEET")
    }

    return res.status(200,deleteTweet,"TWEET DELETED SUCCESSFULLY")
})

const editTweet = asyncHandler(async(req,res)=>{
    const userId= req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT FOUND")
    }
    const {tweetId, newContent} = req.body;
    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400,"TWEET ID NOT VALID OR RECEIVED")
    }
    const tweet = await Tweet.findOne({
        $and:[{_id:tweetId},{owner: userId}]
    });
    const tweetOwner = tweet?.owner;
    if(tweetOwner?.toString() !== userId.toString()){
        throw new ApiError(400,"OWNER OF TWEET NOT MATCHED")
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content:newContent
            }
        },
        {new: true}
    )
    if(!updatedTweet){
        throw new ApiError(400,"ERROR IN UPDATING TWEET")
    }
    return res.status(200)
                .json(new ApiResponse(200,updatedTweet,"TWEET UPDATED SUCCESSFULLY"))
})

const getAllTweets = asyncHandler(async(req,res)=>{
    const allTweets = await Tweet.aggregate([
        {
            $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline:[
                          {
                            $project:{
                          username:1,
                              fullName:1,
                              avatar:1
                            }
                          }
                        ]},
          },
          {
             $project:{
               owner:{
                     $first: "$owner"
                    },
               content:1,
               createdAt:1,
               updatedAt:1
             }
          }
        ]
    );
    if(!allTweets){
        throw new ApiError(400,"NO TWEETS AVAILABLE")
    }
    return res.status(200)
                .json(new ApiResponse(200,allTweets,"ALL TWEETS FETCHED SUCCESSFULLY"))
})

const getAllTweetsByUser = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT LOGGED IN")
    }

    const allTweetsByUser = await Tweet.find({owner: userId});

    if(!allTweetsByUser || !allTweetsByUser.length){
        throw new ApiError(400,"NO TWEETS FOUND BY THE USER")
    }

    return res.status(200)
                .json(new ApiResponse(200,allTweetsByUser,"ALL TWEETS BY USER FETCHED SUCCESSFULLY"))
})

export {createTweet,deleteTweet ,editTweet, getAllTweets, getAllTweetsByUser}