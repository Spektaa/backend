import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import {Video} from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {

    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId)
        throw new ApiError(400, "No Video with such ID exist")

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const totalComments = await Comment.countDocuments({video : videoId})

    const comments = await Comment.find({video : VideoID}).
    populate("owner" , "name avatar")
    .sort({ createdAt: -1 }) 
    .skip(skip)
    .limit(limitNumber);

    return res.status(200).
    json(
        new ApiResponse(200 , comments , "Comments fetched sucessfully")
    )

})

const addComment = asyncHandler(async (req, res) => {
    //comment will be added by a a verifeid user therefore we will have user details in req.user

    const {content , videoId} = req.body

    const objectId = new mongoose.Types.ObjectId(videoId);

    if(!content)
        throw new ApiError(400 , "No comment added , Required Field")

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID format");
    }

    // const video = await Video.findById(objectId);
    // if (!video) {
    //     throw new ApiError(404, "Video not found");
    // }

    const user =await User.findById(req.user._id).select("-password -refreshToken")

    if (!user) {    
        throw new ApiError(401 , "Unauthorized Request")
    }


    const comment = await Comment.create({
        content , 
        video : objectId ,
        owner : user._id ,
    })


    if(!comment)
        throw new ApiError(500 ,"Something went wrong while adding Comment")
    
    return res
    .status(200)
    .json(new ApiResponse(200 , comment , "Comment Added Sucessfully"))

})

const updateComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params

    const {updatedCommenttext } = req.body

    if(!updatedCommenttext)
        throw new ApiError(400 , "No text Added or removed")

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId ,
        {
           $set :{
            content : updatedCommenttext
           } 
        },
        {
            new : true
        }
    )

    if(!updatedComment)
        throw new ApiError(500 , "Server Error , Comment not updated")

    return res.status(200)
    .json(new ApiResponse(200 , updatedComment , "Comment Updated Sucessfully" ))

})

const deleteComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params
    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized: You can only delete your own comments")
    }

    await comment.deleteOne()

    return res.status(200).json(
        new ApiResponse(200, null, "Comment deleted successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
}