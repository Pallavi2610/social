const multer =require("multer");
const path=require("path");

const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"./public/images");
    },
filename:(req,file,cb)=>{
    const uniquesuffix=Date.now()+"-"+Math.round(Math.random()*1e9);
    const updatedfilename=uniquesuffix+path.extname(file.originalname);
    cb(null,updatedfilename);
},

});
const upload =multer({
    storage:storage,
});

module.exports=upload;
