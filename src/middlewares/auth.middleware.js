import jwt from "jsonwebtoken";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
export const verifyJWT= asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        if(!token){
            throw new ApiError(401, "Unauthorized request: USER NOT LOGGED IN");
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET );
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            //discuss about frontend
            throw new ApiError(401, "INVALID ACCESS TOKEN")
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Inavlid access token")
    }
})