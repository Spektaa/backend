import {asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { trusted } from "mongoose"



const registerUser = asyncHandler(async(req ,res) => {
    //get user details from frontend
    //validation(correct formats eg- not empty)
    //check if user already exist :username or email or both
    //files present(avatar and images)
    //upload themn to cloudinary, avatar check
    //create user object(mongodb is a nosql db so objectr oriented) create entry in db
    //remove password and refresh token from fields
    //checkresponse for user creation 
    //return response 

    const {fullname , email , username , password } = req.body

    if([fullname , email , username , password].some((field) => field ?.trim() ==="")){
        throw new ApiError(400 , "All fields are required")
    }

    const existedUser = await User.findOne({
        $or : [{username} ,{email}]
    })

    if(existedUser)
        throw new ApiError(409,"User with this username or email already exist")

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    console.log(avatarLocalPath);

    if(!avatarLocalPath)
        throw new ApiError(400 ,"Avatar  required")

    // console.log(avatarLocalPath);

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    console.log(avatar);

    if(!avatar)
        throw new ApiError(400 ,"Avatar is required")

    //dbentry

    const user = await User.create({
        fullname ,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   ) 

   if(!createdUser)
        throw new ApiError(500 ,"Soemthing went wrong while registering user")

   return res.status(201).json(
        new ApiResponse(200 , createdUser , "User Registered Sucessfully")
   )

})

const generateAccessAndRefreshTokens = async(userId) => {

    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return { 
            accessToken , 
            refreshToken
        }
        
    } catch (error) {
       throw new ApiError(500 , "Something went wrong while generating refresh and access token") 
    }

}

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req ,res) =>{

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        } ,
        {
            new : true
        }
    )

    const options = {
        httpOnly : true ,
        secure : true
    }

    return res.status(200)
    .clearCookie("AccessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200 , {} , "User logged out "))

})

const refreshAccessToken = asyncHandler(async(req , res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken)
        throw new ApiError(401 , "Unauthorized Request")

    try {
        const decodedToken = jwt.verify(incomingRefreshToken , process.nextTick.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user)
            throw new ApiError(401 , "Invalid refresh token")
    
        if(incomingRefreshToken !== user?.refreshToken )
            throw new ApiError(401 ,"Refresh Token is expired or used" )
    
        const options = {
            httpOnly : true , 
            secure : true
        }
    
        const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200)
        .cookie("accessToken" , accessToken , options)
        .cookie("refreshToken" , refreshToken , options)
        .json(
            new ApiResponse(200 , {
                accessToken, refreshToken
            },
            "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid refresh Token")
    }

})

const changeCurrentPassword = asyncHandler(async(req ,res) =>{
    const {oldPassword , newPassword} = req.body
    
    const user = await findById(req.user?._id)

    if(await !(user.isPasswordCorrect(oldPassword)))
        throw new ApiError(401 , "Invalid old password")

    user.password = newPassword
    await user.save({
        validateBeforeSave : false
    })

    return res.status(200)
    .json(new ApiResponse(200 , { } , "Password Changed Correctly"))
}) 

const getCurrentUser = asyncHandler(async(req ,res)=>{
    return res.status(200)
    .json(new ApiResponse(200 , req.user , "Current user fetched"))
})

const updateAccountDetails = asyncHandler(async(req , res)=>{
    const {fullname , email } = req.body

    if(!fullname && !email)
        throw new ApiError(400 , 'All fields are required')

    const user = User.findByIdAndUpdate(
        req.user?._id ,
        {
           $set :{
            fullname ,
            email
           } 
        },
        {
            new : true
        }
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200 , user , "Account details Updated Sucessfully"))
})

const updateUserAvatar =asyncHandler(async(req ,res) =>{

    const avatarLocalPath = req.file?.path

    if(!localStorage)
        throw new ApiError(400 , "Avatar File misisng")

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar)
        throw new ApiError(400 , "Error while uploading avatar")

    const user = await User.findByIdAndUpdate(
        req.user?._id ,
        {
            $set :{
                avatar : avatar.url
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200 , user , "Avatar Image updated")
    )

})

const updateUserCoverImage =asyncHandler(async(req ,res) =>{

    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath)
        throw new ApiError(400 , "Cover Image File misisng")

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage)
        throw new ApiError(400 , "Error while uploading cover image")

    const user = await User.findByIdAndUpdate(
        req.user?._id ,
        {
            $set :{
                coverImage : coverImage.url
            }
        },
        {
            new : true
        }
    ).select("-password")


    return res.status(200)
    .json(
        new ApiResponse(200 , user , "Cpver Image updated")
    )

})

const getUserChannelProfile = asyncHandler(async(req ,res)=>{

    const {username} = req.params

    if(!username?.trim())
        throw new ApiError(400 , "Username is missing")

    const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from : "Subscription",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup:{
                from : "Subscription",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscriberCount : {
                    $size :"$subscribers"
                },
                channelsSubcribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed :{
                    $cond :{
                        if : {
                            $in : [req.user?._id , "$subscribers.subscriber"],
                            then : true ,
                            else :  false
                        }
                    }
                }
            }
        },
        {
            $project : {
                fullname : 1 ,
                username : 1 ,
                subscriberCount : 1 ,
                channelsSubcribedToCount : 1 ,
                isSubscribed : 1,
                avatar : 1 ,
                coverImage : 1 ,
                email : 1

            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404 , "Channel doest not exist")
    }

    return res.status(200)
    .json(
        new ApiResponse(200 , channel[0] , "User Channel fetched Sucessfullly")
    )

})

const getWatchHistory = asyncHandler(async(req , res ) => {

    const user = await User.aggregate([
        {
            $match : {
                _id : new model.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup :{
                from : "Video",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [{
                    $lookup : {
                        from : "User",
                        localField : "owner" ,
                        foreignField : "_id" , 
                        as : "owner" ,
                        pipeline : [
                                {
                                    $project :{
                                        fullname : 1,
                                        username : 1 ,
                                        avatar : 1,
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(
        new ApiResponse(200 , user[0].watchHistory , "Watch History fetched recieved")
    )
})



export {
    registerUser,
    loginUser ,
    logoutUser ,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser ,
    updateAccountDetails ,
    updateUserAvatar ,
    updateUserCoverImage ,
    getUserChannelProfile ,
    getWatchHistory
}