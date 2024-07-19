const mongoose=require("mongoose")

const  plm =require("passport-local-mongoose")
const userSchema=new mongoose.Schema({
    profilepic:{
        type:String,
        default: "default.png",
    },
    name:{
        type:String,
        trim:true,
        require:[true,"name is a require"],
        minLength:[4,"name must be 4 character long"],
    },
    username:{
        type:String,
        trim:true,
        unique:true,
        require:[true,"username is require"],
        minLength:[4,"username must be atleast 4 character long"]
    },
    email:{
        type:String,
        trim:true,
        unique:true,
        lowercase:true,
        require:[true,"email is require"],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please fill a valid email address",
        ],
    },
    password:String,
    resetPasswordToken: {
        type: Number,
        default: 0,
    },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref:"post" }],
},
{ timestamps: true }
);
userSchema.plugin(plm);
const User=mongoose.model("user",userSchema);
module.exports=User;


