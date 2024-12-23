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
            resource_type: auto
        });

        console.log("FILE UPLOADED SUCCESSFULLY IN CLOUDINARY ", response.url);
        return response;
        } 
    catch (error) {
        //delete file from local storage
        fs.unlinkSync(localFilePath)
        console.log("ERROR IN FILE UPLOADING : ",error);
        return null;
    }
}

export default uploadOnCloudinary