import mongoose , {Schema} from "mongoose"

const tweetSchema = newSchema({

    content : {
        type : Schema.Types.ObjectId ,
        ref : "Comment" ,
        required : true
    } ,
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }

},{
    timestamps : true
})

export const Tweet = mongoose.model("Tweet" , tweetSchema);
