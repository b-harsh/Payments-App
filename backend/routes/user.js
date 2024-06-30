const express = require("express");
const router = express.Router();
const zod = require("zod");
const { User } = require("../../db");
const {jwt} = require("jsonwebtoken");
const { authmiddleware } = require('../../middleware');


const signUpSchema = zod.object({
    username:zod.string(),
    firstName:zod.string(),
    lastName:zod.string(),
    password:zod.string(),
})


router.post("/signup", async(req , res)=>{
   const body = req.body;
   const {success} = signUpSchema.safeParse(req.body);
   if(!success){
    return res.json({
        message:"Email is already taken / Incorrect Email"
    })
   }

   const user = User.findOne({
    username:body.username,
   })
   if(user._id){
    return res.json({
        message:"Email already taken / Incorrect inputs"
    })
   }

   const dbUSer = await User.create(body);
   const token = jwt.sign({
    userId:dbUSer._id
   },JWT_SECRET);
   res.json({
    message:"User created Succesfully",
    token:token
   })
   
})




const signInSchema = zod.object({
    username:zod.string().email(),
    password:zod.string(),
})

router.post('/signin' , async(req , res)=>{
    const {success} = signInSchema.safeParse(req.body);
    if(!success){
        return res.status(400).json({
            message:"Incorrect Inputs"
        })
    }
    const user = await User.findOne({
        username:req.body.username,
        password:req.body.password,
    })
    if(user){
        const token = jwt.sign({
            userId:user._id
        },JWT_SECRET);
        res.json({
            token:token
        })
        return;
    }
    res.status(400)/json({message:"erro while logging In"});
})




const updateSchema = zod.object({
    password:zod.string().optional,
    lastName:zod.string().optional,
    firstName:zod.string().optional,
})

router.put('/' , authMiddleware , async(req , res)=>{
  const {success} = updateSchema.safeParse(req.body);
  if(!success){
    res.status(400).json({
        message:"Error"
    })
  }
  await User.upadateOne(req.body,{
    id:req.userId
  })

  res.json({
    message:"Updated Successfully"
  })
})

router.get('/bulk' , async(req, res)=>{
    const filter = req.query.filter || "";
    const users = await User.find({
        $or:[{
            firstName:{
                "$regex":filter
            }
        },{
            lastName:{
                "$regex":filter
            }
        }]
    })

    res.json({
        user:users.map((user)=>({
            username:user.username,
            firstName:user.firstName,
            lastName:user.lastName,
            _id:user._id
        }))
    })
})

module.exports = router;


