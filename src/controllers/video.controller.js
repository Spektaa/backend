import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType =  "desc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if(!query)
        throw new ApiError(400 , "Query missing")
    
    
    const filter = {
        $or: [
            {
                thumbnail : {
                    $regex : query , $options : "i"
                }
            },
            {
                title : {
                    $regex : query , $options : "i"
                }
            },
            {
                description : {
                    $regex : query , $options : "i"
                }
            }
        ]
    } 

    const sortOrder = sortType ==="asc" ? 1  : -1 
    const sort = {[sortBy] : sortOrder}
    
    const videos = await Video.find(filter)
    .sort(sort)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

    if(videos.length === 0)
        throw new ApiError(400 , "No video with such query exist")

    const totalVideos = await Video.countDocuments(filter);

    
     return res.status(200).json(
        new ApiResponse(200, {
            page: pageNum,
            totalPages: Math.ceil(totalVideos / limitNum),
            totalVideos,
            videos
        }, "Videos fetched successfully")
    );

})

const publishAVideo = asyncHandler(async (req, res) => {
    
    const { title, description} = req.body

    if(!title || !description)
        throw new ApiError(400 , "Title or Description not uploaded")

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoLocalPath)
        throw new ApiError(400 ,"VideoFile  required")

    if(!thumbnailLocalPath)
        throw new ApiError(400 ,"thumbnail  required")

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile)
        throw new ApiError(400 ,"videoFile is required")

    if(!thumbnail)
        throw new ApiError(400 ,"thumbnail is required")
    
    const views = 0;
    const isPublished = false; 

    const video = await Video.create({
        title ,
        description,
        videoFile : videoFile.url,
        thumbnail : thumbnail.url ,
        views ,
        isPublished,
        owner : req.user._id,
        duration : videoFile.duration
    })

    if(!video)
        throw new ApiError(500 ,"Soemthing went wrong while uploading video")

   return res.status(200).json(
        new ApiResponse(200 , video , "Video uploaded succesfully Sucessfully")
   )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}