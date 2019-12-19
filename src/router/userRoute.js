const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user')
const auth = require('../middle-ware/auth');
const {sendWelcomeEmail, sendByeEmail} = require('../emails/account');
const router  = new express.Router();


router.post('/users',async (req,res)=>{
    const user = new User(req.body);

    try{
        await user.save();
        sendWelcomeEmail(user.email,user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({user,token});
    }catch(e) {
        res.status(400).send(e);
    }
    
});

router.post('/users/login',async (req,res)=>{
    try{
        const user = await User.findByCredentials(req.body.email,req.body.password);
        const token = await user.generateAuthToken();
        res.send({user,token});
    }catch(e){
        res.status(400).send();
    }
});

router.post('/users/logout',auth,async (req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token; 
        })

        await req.user.save();
        res.send();
    }catch(e){
        res.status(500).send();
    }
});

router.post('/users/logoutAll',auth ,async (req,res)=>{
    try{
        req.user.tokens = [];
        await req.user.save();
        res.send();
    }catch(e){
        res.status(500).send();
    }
})
//auth is middle ware function
router.get('/users/me',auth ,async (req,res)=>{

    res.send(req.user);

    });
//not rquired

// router.get('/users/:id',async (req,res)=>{
//     const _id = req.params.id;
//     try{
//         const user  = await User.findById(_id);
//         if(!user) return res.status(404).send();
//         res.send(user);
//     }catch(e){
//         res.status(500).send(e);
//     }
    

// });

router.patch('/users/me',auth ,async (req,res)=>{
    const allowedUpdates = ['name','email','password','age'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update)=> allowedUpdates.includes(update));

    if(!isValidOperation)
        res.status(400).send({error:'Invalid updates'});
    
        try{
            
            updates.forEach((update)=>req.user[update] = req.body[update]);  //required for middleware to consistently running
            await req.user.save();
            res.send(req.user);

    }catch(e){
        res.status(400).send(e);
    }
});


router.delete('/users/me',auth ,async (req,res)=>{
    try{
        // const user = await User.findByIdAndDelete(req.user._id);
        // if(!user)   return res.status(404).send();

        await req.user.remove();
        sendByeEmail(req.user.email,req.user.name);
        res.send(req.user);
    }catch(e){
        res.status(400).send(e);
    }
});

const avatar = multer({
    // dest:'avatar',  //removing destination will pass data through function so we can do something with it 
    limits:{
        fileSize:1000000
    },
    fileFilter(req,file,cb){

        if(!file.originalname.match(/\.(jpg|jpeg|png)$/))  //using regular expressions
            return cb(new Error('Please upload an image'));
        
            cb(undefined,true); //no error and file is accepted

     }
})

//make sure that they are authenticated to upload through auth middleware
router.post('/users/me/avatar',auth, avatar.single('avatar'),async (req,res)=>{
    const buffer = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer();
    req.user.avatar = buffer; //storing file data to user avatar field
    await req.user.save(); //save user
    res.send('Avatar uploaded');

},(error,req,res,next)=>{
    res.status(400).send({error:error.message});
});

//delete avatar
router.delete('/users/me/avatar',auth,async(req,res)=>{
    req.user.avatar = undefined;
    await req.user.save(); 
    res.send('Avatar Deleted');
});

//showing image
router.get('/users/:id/avatar',async (req,res)=>{
    try{
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar){
            throw new Error();
        }

        res.set('Content-Type','image/png');
        res.send(user.avatar);
    }catch(e){
        res.status(404).send();
    }
})

module.exports = router;