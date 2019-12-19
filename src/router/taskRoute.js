const express = require('express');
const router = new express.Router();
const auth = require('../middle-ware/auth');
const Task = require('../models/tasks');



router.post('/tasks',auth ,async (req,res)=>{
    //const task = new Task(req.body);
    //... es6 spread operator
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try{
        await task.save();
        res.status(201).send(task);
    }catch(e){
        res.status(400).send(e);
    }
});

// GET /tasks?completed=boolean
// GET /tasks?limit=10&skip=10
// GET /tasks?sortBy=createdAt_asc/desc
router.get('/tasks',auth, async (req,res)=>{
    try{
        //const tasks = await Task.find({owner:req.user._id});

        const match = {}
        const sort = {}

        if(req.query.completed)
            match.completed = req.query.completed==='true'

            if(req.query.sortBy)
            {
                const parts = req.query.sortBy.split(':');
                sort[parts[0]] = (parts[1]==='desc')?-1:1 ;
            }

        await req.user.populate({
            path:'usertasks',
            match,
            options:{
                limit: parseInt(req.query.limit), //limits the number of results shown
                skip: parseInt(req.query.skip), //google it if you need it
                sort
            }
        }).execPopulate();
        res.send(req.user.usertasks);
    }catch(e){
        res.status(400).send();
    }

 });

router.get('/tasks/:id',auth, async (req,res)=>{
    const _id = req.params.id;

    try{
        const task = await Task.findOne({_id,owner:req.user._id})
        if(!task) return res.status(404).send();

        res.send(task);
    }catch(e){
        res.status(500).send(e)
    }

});

router.patch('/tasks/:id',auth, async (req,res)=>{

    const allowedUpdates = ['description','completed'];
    const updates = Object.keys(req.body);

    const validOperation = updates.every((update)=>allowedUpdates.includes(update));

    if(!validOperation)
        return res.status(400).send({error:'Invalid updates'});

    try{
        const task = await Task.findOne({_id:req.params.id,owner:req.user._id});
        
        if(!task) return res.status(404).send();

        updates.forEach((update)=>{
            task[update] = req.body[update];
        });

        await task.save();
        res.send(task);
    }catch(e){
        res.status(400).send();
    }
});

router.delete('/tasks/:id',auth, async (req,res)=>{
    try{
        const task = await Task.findOneAndDelete({_id:req.params.id, owner:req.user._id });
        if(!task) return res.status(404).send();
        
        res.send(task);
    }catch(e){
        res.status(400).send(e);
    }
});

module.exports = router;