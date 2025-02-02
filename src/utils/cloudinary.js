import {v2 as cloudinary} from "cloudinary"
import dotenv from 'dotenv';
import fs from "fs"
import path from "path";
dotenv.config({
    path : './.env'
}); 

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME , 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// console.log(process.env.CLOUDINARY_CLOUD_NAME , process.env.CLOUDINARY_API_KEY ,process.env.CLOUDINARY_API_SECRET);

const uploadOnCloudinary = async(localFilePath) =>{
    try {
        if(!localFilePath){
            return null;
        }
        //ulpoad the file on cloudinary

        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type: "auto"
        })

        //file has been uploaded sucesfully
        // console.log("file is uploaded on cloudinary" , response.url);
        fs.unlinkSync(localFilePath)  
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)  //remove the locally saved temporary file as the operation got failed
        return null;
    }
}


export {uploadOnCloudinary}

