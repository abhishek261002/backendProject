import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscriptions.model.js";
import mongoose,{ isValidObjectId } from "mongoose";

const toggleSubscription = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT FOUND")
    }
    const {channelId} = req.params;
    if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError(400,"CHANNEL NOT FOUND")
    }
    const IsSubscribed = await Subscription.findOne({
        $and:[{subscriber: userId},{channel :channelId}]
    })

    if(!IsSubscribed){ //subscibtion doc not present then create
        const subscribeToChannel = await Subscription.create({
            subscriber: userId,
            channel: channelId
        })
        if(!subscribeToChannel){
            throw new ApiError(400,"ERROR IN SUBSCRIBING TO CHANNEL")
        }

        return res.status(200)
                    .json(new ApiResponse(200,subscribeToChannel,"SUBSCRIBED TO CHANNEL SUCCESSFULLY"))
    }
    //subscibtion doc present then delete

    const unsubscribeToChannel = await Subscription.deleteOne({
        $and:[{subscriber: userId},{channel :channelId}]
    })

    if(!unsubscribeToChannel){
        throw new ApiError(400,"ERROR IN UNSUBSCRIBING TO CHANNEL")
    }

    return res.status(200)
                .json(new ApiResponse(200,unsubscribeToChannel,"UNSUBSCRIBED TO CHANNEL SUCCESSFULLY"))
})

const getAllSubscribedChannels = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"USER NOT FOUND")
    }
    const allSubscriptions = await Subscription.aggregate([
        {
        $match: {
          subscriber:new mongoose.Types.ObjectId(userId)
            }
        },
        {
              $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "SubscribedChannel",
              pipeline:[
                {
                  $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscriberCount",
                   
                },
                  },
                {
                  $project:{
                    subscriberCount:{
                      $size:"$subscriberCount"
                    },
                    username:1,
                    fullName:1,
                    avatar:1
                  }
                }
                
              ]
              }
        },
        {
            $project:{
                SubscribedChannel:{
                $first:"$SubscribedChannel"
              },  
            }
        }
        ])
    
    if(!allSubscriptions){
        throw new ApiError(400,"ERROR IN FETCHING SUBCRIBED CHANNELS ")
    }

    return res.status(200)
                .json(new ApiResponse(200,allSubscriptions,"SUBSCRIBED CHANNEL FETCHED SUCCESSFULLY"))
})

export {toggleSubscription, getAllSubscribedChannels} 