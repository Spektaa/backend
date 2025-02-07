import { Router } from "express";
import {logoutUser , loginUser , registerUser , refreshAccessToken ,changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { addComment, updateComment } from "../controllers/comment.controller.js";
import {publishAVideo , getVideoById , updateVideo} from "../controllers/video.controller.js";



const router = Router()

router.route("/register").post(
    upload.fields([{
        name :"avatar",
        maxCount : 1
    }, {
        name: "coverImage",
        maxCount : 1
    }]) , registerUser)

    // router.route("/login").post(login)
router.route("/login").post(loginUser)

//secured routes

router.route("/logout").post( verifyJWT , logoutUser)
router.route("/refreshToken").post(refreshAccessToken)
router.route("/change-pasword").post(verifyJWT , changeCurrentPassword)
router.route("/current-user").get(verifyJWT , getCurrentUser)
router.route("/update-account").patch(verifyJWT , updateAccountDetails)
router.route("/avatar").patch(verifyJWT ,upload.single("avatar") ,updateUserAvatar)
router.route("/cover-image").patch(verifyJWT ,upload.single("coverImage") ,updateUserCoverImage)
router.route("/c/:username").get(verifyJWT ,getUserChannelProfile)
router.route("/history").get(verifyJWT ,getWatchHistory)

//video routes

router.route("/publish-video").post(verifyJWT ,upload.fields([{
    name :"videoFile",
    maxCount : 1
}, {
    name: "thumbnail",
    maxCount : 1
}]) ,publishAVideo)

router.route("/get-video/:videoId").get(verifyJWT ,getVideoById)
router.route("/update-video").patch(verifyJWT , upload.single("videoFile"), updateVideo)


//comment routes

router.route("/add-comment").post(verifyJWT ,addComment)
router.route("/update-comment").post(verifyJWT ,  updateComment)


export default router