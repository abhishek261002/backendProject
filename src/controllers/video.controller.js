import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
  streamVideoFromCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const uploadNewVideo = asyncHandler(async (req, res) => {
  //get user from req.user authmiddleware
  //videofilepath,thumbnail,title,description, duration(cloudinary se le lenge) extract
  //user se pucho publish karna hai ki nhi(isPublished-boolean)
  //user hai to upload on cloudinary
  //path will be given by multer
  //after upload successfull => user

  const user = req.user;
  if (!user) {
    throw new ApiError(400, "USER NOT LOGGED IN");
  }
  const owner = req.user?._id;
  const { title, description, isPublished } = req.body;
  const videoFilePath = req.files?.videoFile?.[0].path;
  //const videoFilePath = req.file?.path;
  const thumbnailPath = req.files?.thumbnail?.[0].path;
  if (
    !(
      videoFilePath &&
      title &&
      thumbnailPath &&
      description &&
      isPublished &&
      owner
    )
  ) {
    throw new ApiError(400, "PLEASE PROVIDE ALL FIELDS TO UPLOAD");
  }
  const uploadedVideo = await uploadOnCloudinary(videoFilePath);
  const duration = await uploadedVideo.duration;
  // console.log(uploadedVideo);
  const thumbnail = await uploadOnCloudinary(thumbnailPath);
  if (!uploadedVideo || !thumbnail) {
    throw new ApiError(
      400,
      "ERROR IN UPLOADING VIDEO OR THUMBNAIL ON CLOUDINARY"
    );
  }

  const video = await Video.create({
    videoFile: uploadedVideo.url,
    thumbnail: thumbnail.url,
    title,
    description,
    owner,
    duration,
    isPublished,
    videoPublicIdForCloudinary: uploadedVideo.public_id,
  });
  if (!video) {
    throw new ApiError(400, "VIDEO MODEL NOT CREATED SUCCESSFULLY");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "VIDEO UPLOADED SUCCESSFULLY"));
});

const deleteExistingVideo = asyncHandler(async (req, res) => {
  //check req.user._id
  //match userid with owner of video
  //search for video document
  //if matched Video.deleteOne({video _id})
  //after delete from mongoose , delete from cloudinary as well

  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "USER NOT LOGGED IN");
  }
  const { videoId } = req.body;
  if (!videoId) {
    throw new ApiError(400, "SELECT VIDEO TO DELETE");
  }
  const findVideo = await Video.findById(videoId);
  console.log("find video ", findVideo);
  const ownerOfVideo = await findVideo.owner;
  console.log(userId, ownerOfVideo);
  if (userId.toString() !== ownerOfVideo.toString()) {
    throw new ApiError(400, "NOT OWNER OF VIDEO");
  }
  const deleteVideo = await Video.deleteOne({ _id: findVideo._id });
  console.log(deleteVideo);

  if (!deleteVideo) {
    throw new ApiError(400, "ERROR IN DELETING VIDEO");
  }

  //problem in logic for deleting from cloudinary
  const public_id = await findVideo?.videoPublicIdForCloudinary;
  console.log("public id ", public_id);
  const deleteCloudinary = await deleteFromCloudinary(public_id.toString());
  console.log(deleteCloudinary);

  return res
    .status(200)
    .json(new ApiResponse(200, findVideo, "VIDEO DELETED SUCCESSFULLY"));
});

const editExistingVideo = asyncHandler(async (req, res) => {
  //logged in user hai aur owner hai video ka to hi edit
  //take new title,description, thumbnail
  //search video document from videoid
  //rewrite fields and then save the document

  const userId = req.user._id;
  if (!userId) {
    throw new ApiError(400, "USER NOT LOGGED IN");
  }

  const { title, description, videoId } = req.body;
  const newThumbnailPath = req.file?.path;
  if (!title || !description || !videoId || !newThumbnailPath) {
    throw new ApiError(400, "SOME FIELD MISSING");
  }
  const thumbnail = await uploadOnCloudinary(newThumbnailPath);
  const video = await Video.findById(videoId);
  const owner = await video?.owner;
  if (userId.toString() !== owner.toString()) {
    throw new ApiError(400, "OWNER DOESN'T MATCH");
  }
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail?.url,
      },
    },
    { new: true }
  );
  if (!updatedVideo) {
    throw new ApiError(400, "ERROR IN UPDATING VIDEO");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "VIDEO UPDATED SUCCESSFULLY"));
});

const getVideoToStream = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "VIDEO NOT FOUND => VideoID");
  }
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
              subscribersCount: {
                $size: "$subscribers",
              },
            },
          },
        ],
      },
    },
    {
      $lookup:{
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "totalLikesOnVideo",
      }
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        totalLikesOnVideo:{
          $size: "$totalLikesOnVideo"
        }
      },
    },
  ]);

  if (!video) {
    throw new ApiError(400, "VIDEO NOT FOUND");
  }
  

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "SUCCESSFULL"));
});

const listAllVideosOfChannel = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "USERNAME MISSING");
  }
  const Allvideos = await User.aggregate([
    {
      $match: {
        username,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "allVideos",
        pipeline: [
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              isPublished: 1,
              createdAt: 1,
              views: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 0,
        countOfVideos: { $size: "$allVideos" },
        allVideos: 1,
      },
    },
  ]);
  if (!Allvideos) {
    throw new ApiError(400, "ERROR IN FETCHING OR NO VIDEOS UPLOADED BY USER");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        Allvideos[0],
        "ALL VIDEOS OF CHANNEL FETCHED SUCCESSFULLY"
      )
    );
});

const addVideoToWatchHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "USER NOT LOGGED IN");
  }

  const { videoId } = req.body; // Replace with the actual video ID
  if (!isValidObjectId(videoId) || !videoId) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const user = await User.updateOne(
    { _id: userId }, // Match the user by username
    { $push: { watchHistory: videoId } } // Add the video ID to watchHistory array
  );

  if (!user) {
    throw new ApiError(400, "ERROR IN PUSHING VIDEO TO WATCH HISTORY");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "VIDEO ADDED TO WATCH HISTORY SUCCESSFULLY")
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.body;
  const userId = req.user._id;
  if (!userId) {
    throw new ApiError(400, "USER NOT LOGGED IN");
  }
  if (!isValidObjectId(videoId) || !videoId) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video Not Found");
  }
  const videoOwner = video?.owner;

  if (videoOwner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not allowed to modify this video status");
  }

  const modifyVideoPublishStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        modifyVideoPublishStatus,
        "VIDEO'S PUBLISH STATUS CHANGED SUCCESSFULLY"
      )
    );
});

const getAllVideos = asyncHandler(async (req, res) => {
  const allvideos = await Video.aggregate([
    {
      $match: {
        isPublished: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  if (!allvideos) {
    throw new ApiError(400, "NO VIDEOS FOUND");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, allvideos, "ALL VIDEOS FETCHED SUCCESSFULLY"));
});

export {
  uploadNewVideo,
  deleteExistingVideo,
  editExistingVideo,
  getVideoToStream,
  listAllVideosOfChannel,
  addVideoToWatchHistory,
  togglePublishStatus,
  getAllVideos,
};
