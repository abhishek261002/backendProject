import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js";
 
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
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
  
   
    if(!avatarLocalPath){
       throw new ApiError(
        400, //statuscode
        "AVATAR FILE IS REQUIRED"
       )
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    let coverImage= "";
    if(coverImageLocalPath){
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
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
    if(!username || !email || username ==="" || email===""|| password===""){
        throw new ApiError(
            400, //statuscode 
     "SOME DETAILS NOT FILLED"
        )
    }
    const options = {
        httpOnly:true,
        secure:true
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
            .cookie("accessToken", accessToken , options)
            .cookie("refreshToken" ,refreshToken, options)
            .json( new ApiResponse(200, loggedInUser , "LOGIN SUCCESSFULL"))
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
const options = {
    httpOnly:true,
    secure:true
}

    return res.status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200,{}, "LOGOUT SUCCESSFUL"))
})

export {registerUser , loginUser ,logoutUser}   