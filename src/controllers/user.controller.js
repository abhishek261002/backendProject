import {asyncHandler} from "../utils/asyncHandler.js"
import mongoose from "mongoose"
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {Like} from "../models/like.model.js"
import {Subscription} from "../models/subscriptions.model.js"
import {uploadOnCloudinary ,deleteFromCloudinary} from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

let avatarPublicID;
let coverImagePublicID;
const options = {
    httpOnly: true,
    secure: false,
    sameSite: 'None',
}

const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user =  await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});
        return{accessToken ,refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser =  asyncHandler( async(req,res)=>{
    // get user details from frontend (done)
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary,again check avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
    const {fullName , username, email ,password} = req.body; 
    //checking for emply inputs
    if(fullName==="" || username ==="" || email===""|| password===""){
        throw new ApiError(
            400, //statuscode 
     "SOME DETAILS NOT FILLED"
        )
    }
    //checking for existing user

    const existedUser = await User.findOne({ $or: [{ username: username},{email : email}]}).exec();
    console.log(existedUser);
    if(existedUser){
        throw new ApiError(
            409 ,//statuscode
            "USER WITH SAME USERNAME OR EMAIL ALREADY EXIST"
        )}
    //now uploading on cloudinary
    let coverImageLocalPath;
    if(req.files.coverImage){
        coverImageLocalPath = req.files.coverImage?.[0].path;
    }
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
  
   
    if(!avatarLocalPath){
       throw new ApiError(
        400, //statuscode
        "AVATAR FILE IS REQUIRED"
       )
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(avatar){
        avatarPublicID= avatar.public_id;
    }
    let coverImage= "";
    if(coverImageLocalPath){
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
        coverImagePublicID= coverImage.public_id;
    }
  
    if(!avatar){
        throw new ApiError(
            400, //statuscode
            "AVATAR FILE IS REQUIRED"
        )
    }
    //console.log(req.files);
    // console.log("avatar url = ", avatar.url);

    //now creating user object and making entry in db
    const user = await User.create({username: username.toLowerCase() ,
         email , fullName , password ,
         avatar: avatar.url ,
         coverImage :coverImage?.url || ""
        })
    //check user created or not
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
        throw new ApiError(
            500, //statuscode
            "Something went wrong while creating user"
        )}

    //return res
    return res.status(201).json(
        new ApiResponse(200, createdUser , "USER REGISTERED SUCCESSFULLY")
    )
})

const loginUser = asyncHandler(async(req,res)=>{
    //req.body - email,password,username
    //db query email/username 
    //password compare isPasswordCorrect method
    //access token and refresh token generate
    //send cookies
    //if user exists then res ok

    const {username , email ,password} = req.body;
    if(!username && !email){
        throw new ApiError(
            400, //statuscode 
     "USERNAME OR EMAIL REQUIRED"
        )
    }
    
    const user = await User.findOne({ $or: [{ username: username},{email : email}]}).exec();
    //console.log(existedUser);
    if(!user){
        
        res.clearCookie("refreshToken",options).clearCookie("accessToken",options)
        throw new ApiError(401 , "USER NOT FOUND ,Verify login details" )
        
    }
    
    const PassCorrect = await user.isPasswordCorrect(password);
    if(!PassCorrect){
        throw new ApiError(401,"PASSWORD INCORRECT")
    }
    const {refreshToken, accessToken} = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    

    return res.status(200)
            .cookie("accessToken", accessToken , {
                httpOnly: true,
                secure: false,
            })
            .cookie("refreshToken" ,refreshToken, options)
            .json( new ApiResponse(200, 
                                        {
                                           user: loggedInUser, accessToken, refreshToken
                                        } ,
                                        "LOGIN SUCCESSFULL"))
})

const logoutUser = asyncHandler(async(req,res)=>{
    //cookies clear 
    //user select using cookies
    //usermodel -> remove refreshToken 
   const user = await User.findByIdAndUpdate(req.user._id , 
    {
        $set: {
            refreshToken: undefined
        }
    },
    {
        new: true
    })


    return res.status(200)
            .clearCookie("accessToken")
            .clearCookie("refreshToken")
            .json(new ApiResponse(200,{}, "LOGOUT SUCCESSFUL"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request : Token invalid")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        if(!user){
            throw new ApiError(401, "Unauthorized request : Invalid refresh token")
        }

        // console.log(incomingRefreshToken);
         // console.log(user.refreshToken);
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401 ,"Refresh token expired or used")
        }
        const{accessToken ,refreshToken} = await generateAccessAndRefreshToken(user?._id);
        return res.status(200)
            .cookie("accessToken",accessToken ,options)
            .cookie("refreshToken",refreshToken, options)
            .json(
                new ApiResponse(200, {accessToken ,refreshToken} , "ACCESS TOKEN REFRESHED")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    //access user through refresh token
    //take old password from user to verify old password
    //modify user.password field
    //save user with modified password
    const reqUser =await req.user;
    if(!reqUser){
        throw new ApiError(400, "User not logged in")
    }
    try {
        const user =await User.findById(reqUser?._id)
        if(!user){
            throw new ApiError(400, "User not found")
        }
        const userPassword =await user?.password;
        // console.log(userPassword);
        const {inputOldPassword,inputNewPassword} = req.body;
        if(!(inputOldPassword && inputNewPassword )){
            throw new ApiError(401, "ENTER THE OLD & NEW PASSWORD")
        }
        const isPasswordCorrect = await user.isPasswordCorrect(inputOldPassword, userPassword);
        if(!isPasswordCorrect){
            throw new ApiError(400, "OLD PASSWORD INCORRECT- CHECK AGAIN")
        }
        user.password= inputNewPassword;
        await user.save({validateBeforeSave : false});
    
        return res.status(200).json(
            new ApiResponse(200 , user , "PASSWORD CHANGED SUCCESSFULLY")
        )
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong while changing password")
    }
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId){
        throw new ApiError(400,"USER NOT LOGGED IN")
    }
    const likedVideos = await Like.aggregate([
        {
          $match:{
            video: { $exists: true},
            likedBy : new mongoose.Types.ObjectId(userId)
          }
        } ,
        {
          $project: {
            video:1,
            _id:0
          }
        }
    ])

    const likedComments = await Like.aggregate([
        {
          $match:{
            comment: { $exists: true},
            likedBy : new mongoose.Types.ObjectId(userId)
          }
        } ,
        {
          $project: {
            comment:1,
            _id:0
          }
        }
      ])

    const subscribedChannels = await Subscription.aggregate([
        {
            $match:{
                subscriber : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project:{
                channel :1,
                _id:0
            }
        }
    ])
    const data = {
        userData: req.user,
        likedVideos: likedVideos?.map((v) => v.video) || [],
        likedComments: likedComments?.map((c) => c.comment) || [],
        subscribedChannels: subscribedChannels?.map((s) => s.channel) || [],
    }


    return res.status(200)
        .json(new ApiResponse(200 , data , "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    //get user from req.user 
    // req.body contains email, fullname
    //
    const reqUser= req.user;
    if(!reqUser){
        throw new ApiError(400, "USER NOT FOUND")
    }
    // console.log(reqUser);
    const {email , fullName} = req.body;
    if(!email || !fullName){
        throw new ApiError(400 , "ENTER EMAIL OR FULNAME TO PROCEED")
    }
    const user= await User.findByIdAndUpdate(
        reqUser?._id,
        {
            $set:{ 
                fullName,
                email
            }
        },
        {new : true}
    ).select("-password -refreshToken")
    if(!user){
        throw new ApiError(400, "USER NOT FOUND")
    }

    return res.status(200)
    .json(new ApiResponse(200 , user?user:{} , "USER DETAILS UPDATED SUCCESSFULLY"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    //req.user
    //avatar = (upload on cloudinary req.files).url
    //after upload success or fail clear temp 
    //user.finbyidandUpdate => set: avatar
    const reqUser = req.user;
    if(!reqUser){
        throw new ApiError(400,"USER NOT LOGGED IN")
    }
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "UPLOAD AVATAR TO UPDATE")
    }
    const avatar =await uploadOnCloudinary(avatarLocalPath);
    console.log("AVATAR ",avatar);
    if(avatar){
        const deletefrom = await deleteFromCloudinary(avatarPublicID);
        avatarPublicID= avatar.public_id;
    }
    const user =await User.findByIdAndUpdate(
        reqUser.id,
        {
            $set:{
                avatar : avatar.url}
        },
        {new: true}
    ).select("-password -refreshToken")
   // console.log("USER.AVATAR",user.avatar);
    return res.status(200)
        .json(new ApiResponse(200, user ,"AVATAR UPDATED SUCCESSFULLY"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    //req.user
    //avatar = (upload on cloudinary req.files).url
    //after upload success or fail clear temp 
    //user.finbyidandUpdate => set: avatar
    const reqUser = req.user;
    if(!reqUser){
        throw new ApiError(400,"USER NOT LOGGED IN")
    }
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400, "UPLOAD COVER IMAGE TO UPDATE")
    }
    const coverImage =await uploadOnCloudinary(coverImageLocalPath);
    //console.log("AVATAR ",avatar);
    if(coverImage){
        await deleteFromCloudinary(coverImagePublicID)
        coverImagePublicID= coverImage.public_id; 
    }
    const user =await User.findByIdAndUpdate(
        reqUser.id,
        {
            $set:{
                coverImage : coverImage.url}
        },
        {new: true}
    ).select("-password -refreshToken")
   // console.log("USER.AVATAR",user.avatar);
    return res.status(200)
        .json(new ApiResponse(200, user ,"COVER IMAGE UPDATED SUCCESSFULLY"))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const { username } = req.params; 
   
    if(!username.trim()){
        throw new ApiError(400, "USERNAME MISSING")
    }
    const channel = await User.aggregate([{
        $match:{
            //search karo user through username
            username: username?.toLowerCase()
        }
    },
    {
        //join karo user aur subscription models ko and _id se channel match kro
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"
        }
    },
    {
        //join karo user aur subscription models ko and _id se subscriber match  kro
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscriberTo"
        }
    },
    {
        $addFields:{
            subscribersCount: {
                //subscibers field ka count
                $size: "$subscribers"
            },
            channelsSubscribedToCount:{
                //subscriberTo field ka count
                $size: "$subscriberTo"
            },
            isSubscribed: {
                //req.user._id ko subscribers.subscriber me check karo
                $cond:{
                    if: {
                        $in: [req.user?._id , "$subscribers.subscriber"]
                    },
                    then: true,
                    else: false
                }
            }
        }
    }
    ,{
        $project:{
            //kya kya display karna hai
            username:1,
            email:1,
            fullName:1,
            avatar:1,
            coverImage:1,
            subscribersCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1
        }
    }])
   // console.log(channel);
    if(!channel?.length){
        throw new ApiError(400, "CHANNEL NOT FOUND")
    }
    return res.status(200)
        .json(new ApiResponse(200, channel[0] || {} , "CHANNEL PROFILE FETCHED SUCCESSFULLY"))
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const userId = req.user._id
    if(!userId){
        throw new ApiError(400,"USER NOT LOGGED IN")
    }
    const user =await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                        {   
                            $lookup:{
                                from: "users",
                                localField:"owner",
                                foreignField:"_id",
                                as:"owner",
                                pipeline:[{
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }]
                            }
                        },
                        {
                            $addFields:{
                                owner:{
                                    $first:"$owner"
                                    //or $arrayElemAt:["$owner",0]
                                }
                        }
                        }
                    ]}
        },
        
    ])
  
    if(!user){
        throw new ApiError(400,"ERROR IN FETCHING WATCH HISTORY")
    }

    return res.status(200)
        .json( new ApiResponse(200,user?.watchHistory, "WATCH HISTORY FETCHED SUCCESSFULLY"))
}
)

export {registerUser , loginUser ,logoutUser , refreshAccessToken , changeCurrentPassword ,getCurrentUser ,
     updateAccountDetails , updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory}   