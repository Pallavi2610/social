const  mongoose=require("mongoose");


const refeschema= new mongoose.Schema(
    {
        title:{
            type:String,
            trim:true,
            required:[true,"title is required"],
            minLength:[4,"title must be atleast 4 character long"],
        },
        media:{
            type:String,
            required:[true,"media is required"],
        },
        user:{type:mongoose.Schema.Types.ObjectId,ref:"user"},
        likes:[{type:mongoose.Schema.Types.ObjectId,ref:"user"}],

    },
    {timestamps:true}
);
const Post= mongoose.model("post",refeschema);

module.exports= Post;
