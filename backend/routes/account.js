const express  = require('express');
const {Account} = require('../db');
const {default:mongoose} = require('mongoose');
const { authmiddleware } = require('../../middleware');

const router = express.Router();

router.get('/balance' , authmiddleware , async(req , res)=>{
    const account = await Account.findOne({
        userId:req.userId
    });

    res.json({
        balance:account.balance
    })
})


router.post('/transfer' , authmiddleware , async(req  , res)=>{
    const session =  await mongoose.startSession();
    session.startTransaction();
    const {amount , to} = req.body;
    
    const account = await Account.findOne({userId:req.userId}).session(session);

    if(!account || amount > account.balance){
        await session.abortTransaction();
        return res.status(400).json({
            message:"Insufficinet Balance"
        })
    }

    const receiver = await Account.findOne({userId:req.userId}).session(session);

    if(!receiver ){
        await session.abortTransaction();
        return res.status(400).json({
            message:"Invalid Account"
        })
    }

    await Account.updateOne({userId:req.userId} , {$inc:{balance: -amount}}).session(session);
    await Account.updateOne({userId:to} , {$inc:{balance: -amount}}).session(session);

    await session.commitTransaction();
    res.json({
        message:"Transfer Successfull"
    });
});

module.exports =router;