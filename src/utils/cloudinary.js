 import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async(localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type: "auto",
            auto_transcription : "true",
           eager: [
    { streaming_profile: "full_hd", format: "m3u8" },
  ],
  eager_async: true,
        
        });
        if(response){
            fs.unlinkSync(localFilePath);
        }
        // console.log("FILE UPLOADED SUCCESSFULLY IN CLOUDINARY ", response.url);
        return response;
        } 
    catch (error) {
        //delete file from local storage
        fs.unlinkSync(localFilePath);
        console.log("ERROR IN FILE UPLOADING : ",error);
        return null;
    }
}
const deleteFromCloudinary = async(publicId) => {
    try {
        if(!publicId) return null
        //upload file to cloudinary
        const response = await cloudinary.uploader.destroy(publicId);
        // console.log("FILE DELETED SUCCESSFULLY FROM CLOUDINARY ", response);
        return response;
        } 
    catch (error) {
        console.log("ERROR IN FILE DELETING : ",error);
        return null;
    }
}
const streamVideoFromCloudinary = async(publicId)=>{
    return cloudinary.url(publicId, {resource_type: "video",
        transformation: [
          {width: "0.2", crop: "scale"}
        ]})
}


export  {uploadOnCloudinary ,deleteFromCloudinary, streamVideoFromCloudinary}