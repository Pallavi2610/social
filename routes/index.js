var express = require('express');
var router = express.Router();

const upload=require("../utils/malter");
// .single("profilepic");
const fs=require("fs");
const path=require("path");

const user =require("../models/schema");

const passport=require("passport");
const LocalStrategy=require("passport-local");
const sendmail = require('../utils/mail');
const Post = require('../models/refeschema');
passport.use(new LocalStrategy(user.authenticate()))

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index',{user:req.user});
});
router.get('/login', function(req, res, next) {
  res.render('login',{user:req.user});
});

router.post("/login-user",
  passport.authenticate("local",{
    successRedirect:"/profile",
    failureRedirect:"/login",
  }),
  function(req,res,next){}
);

router.get("/logout-user/:id",function(req,res,next){
  req.logout(()=>{
    res.redirect("/login");
  })
})

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    next();
  }
  else{
    res.redirect("/login")
  }
}

router.get('/register', function(req, res, next) {
  res.render('register',{user:req.user});
});
router.post('/register-user',async function(req, res, next) {
  try{
    const{username,email,name,password}=req.body;
    await user.register({name,username,email},password);
    res.redirect('/login');
  } 
  catch(error){
  res.send(error);
  }
});
router.get('/about', function(req, res, next) {
  res.render('about',{user:req.user});
});
router.get('/profile', isLoggedIn,async function(req, res, next) {
  try {
    const posts=await Post.find().populate("user");
    res.render('profile',{user: req.user,posts});

  } catch (error) {
    console.log(error);
    res.send(error);
    
  }
});
router.get("/update-user/:id",isLoggedIn,function(req,res,next){
  res.render("update",{user: req.user});
});

router.get("/reset-password/:id",isLoggedIn,function(req,res,next){
  res.render("reset",{user:req.user});
});

router.post("/reset-password/:id",isLoggedIn,async function(req,res,next){
  try{
    await req.user.changePassword(
      req.body.oldpassword,
      req.body.newpassword
    );
    await res.user.save();
    res.redirect(`/update-user/${req.user._id}`);
   }catch(error){
    res.send(error)
  }
});

// router.get("/delete-user/:id",isLoggedIn,async function(req,res,next){
//   try {
//     const deleteduser= await user.findByIdAndDelete(req.params.id);
//     if(req.user.profilepic !== "default.png"){
//       fs.unlinkSync(
//         path.join(__dirname,
//           "..",
//           "public",
//           "images",
//           req.user.profilepic
//         )
//       );
//     };
//     res.redirect("/login");
//   } catch (error) {
//     res.send(error);
    
//   }
// })
router.get("/delete-user/:id", isLoggedIn, async function (req, res, next) {
  try {
      const deleteduser = await User.findByIdAndDelete(req.params.id);

      if (deleteduser.profilepic !== "default.png") {
          fs.unlinkSync(
              path.join(
                  __dirname,
                  "..",
                  "public",
                  "images",
                  deleteduser.profilepic
              )
          );
      }

      deleteduser.posts.forEach(async (postid) => {
          const deletedpost = await Post.findByIdAndDelete(postid);
          console.log(deletedpost);
          fs.unlinkSync(
              path.join(
                  __dirname,
                  "..",
                  "public",
                  "images",
                  deletedpost.media
              )
          );
      });

      res.redirect("/login");
  } catch (error) {
      res.send(error);
  }
});




router.post("/image/:id",isLoggedIn,upload.single("profilepic"),async function(req,res,next){
  try {
    if(req.user.profilepic !== "default.png"){
      fs.unlinkSync(
        path.join(__dirname,
          "..",
          "public",
          "images",
          req.user.profilepic
        )
      );
    }
    req.user.profilepic=req.file.filename;
    await  req.user.save();
    res.redirect(`/update-user/${req.params.id}`)
  } catch (error) {
    res.send(err)
    
  }
});

router.get("/forget-email",function(req,res,next){
  res.render("forgetemail",{user:req.user});
});

router.post("/forget-email",async function (req,res,next){
  try{
    const single=await user.findOne({email:req.body.email});
    if(single){
      const url=`${req.protocol}://${req.get("host")}/forget-password/${single._id}`;
      sendmail(res,single,url);
      // res.redirect(`/forget-password/${single._id}`);
    }else{
      res.redirect("/forget-email");
    }
  }catch(error){
    console.log(error);
    res.send(error);
  }
})

router.get("/forget-password/:id",async(req,res,next)=>{
  res.render("forgetpassword",{user:req.user,id:req.params.id});
});

router.post("/forget-password/:id",async(req,res,next)=>{
  try{ 
    const sing= await user.findById(req.params.id);
    if(sing.resetPasswordToken === 1){
      await sing.setPassword(req.body.password);
      sing.resetPasswordToken = 0;
      await sing.save();
    res.redirect("/login");
    }else{
      res.send("Link Expired Try Again!");
    }
    // res.redirect("/login");
  }catch(error){
    res.send(error);
    
  }
});

router.get("/post-create/", isLoggedIn, function (req, res, next) {
  res.render("postcreate", { user: req.user });
});

router.post("/post-create/",isLoggedIn, upload.single("media"), async function(req,res,next){
  try {
    const newpost=new Post({
      title:req.body.title,
      media:req.file.filename,
      user:req.user._id,
    });
    console.log(req.user)
      req.user.posts.push(newpost._id);
      await newpost.save();
      await  req.user.save();
      
      res.redirect("/profile");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
})

router.get("/like/:postid", isLoggedIn, async function (req, res, next) {
  try {
      const post = await Post.findById(req.params.postid);
      if (post.likes.includes(req.user._id)) {
          post.likes = post.likes.filter((uid) => uid != req.user.id);
      } else {
          post.likes.push(req.user._id);
      }
      await post.save();
      res.redirect("/profile");
  } catch (error) {
      res.send(error);
  }
});

router.get("/timeline", isLoggedIn, async function (req, res, next) {
  try {
      res.render("timeline", { user: await req.user.populate("posts") });
  } catch (error) {
      res.send(error);
  }
});

router.get("/update-post/:pid", isLoggedIn, async function (req, res, next) {
  try {
      const post = await Post.findById(req.params.pid);
      res.render("postupdate", { user: req.user, post });
  } catch (error) {
      res.send(error);
  }
});

router.post("/update-post/:pid", isLoggedIn, async function (req, res, next) {
  try {
      await Post.findByIdAndUpdate(req.params.pid, req.body);
      res.redirect(`/update-post/${req.params.pid}`);
  } catch (error) {
      res.send(error);
  }
});

router.get("/delete-post/:id", isLoggedIn, async function (req, res, next) {
  try {
      const deletepost = await Post.findByIdAndDelete(req.params.id);

      fs.unlinkSync(
          path.join(__dirname, "..", "public", "images", deletepost.media)
      );
      res.redirect("/timeline");
  } catch (error) {
      res.send(error);
  }
});
module.exports = router;
