const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Task = require('./tasks')
//creating a schema which helps in using us middleware

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    age:{
        type: Number,
        default:0,
        validate(value){
            if(value<0) throw new Error('Age must be positive');
        }
    },
    email:{
        type:String,
        required:true,
        trim:true,
        lowercase:true,
        unique:true,
        validate(value){
            if(!validator.isEmail(value))
                throw new Error('Email not valid');
        }
    },
    password:{
        type:String,
        required:true,
        trim:true,
        minlength:6,
        validate(value){
            if(value.toLowerCase().includes('password'))
                throw new Error('your password should not contain password');
        }
    },
    tokens:[{
        token:{
            type:'String',
            required:true
        }
    }],
    avatar:{
        type:Buffer  //store image alongside user data
    }
},{
    timestamps:true
});

//setting up virtual property, relationship between user and task
//not stored in database
userSchema.virtual('usertasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
});


userSchema.methods.toJSON =  function(){
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;
    
    return userObject;
}

userSchema.methods.generateAuthToken = async function(){
    const user = this;
    const token = jwt.sign({_id:user._id.toString()},process.env.JWT_SECRET);
    user.tokens = user.tokens.concat({token});
    await user.save();
    return token;
}


//log in for a user
userSchema.statics.findByCredentials= async (email,password)=>{
    const user = await User.findOne({email});
    if(!user){
        throw new Error('Unable to login');
    }
    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch){
        throw new Error("Unable to login");
    }

    return user;
};
//hash plain text password before saving user
userSchema.pre('save',async function(next){
    const user = this;
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8);
    }

    next();
});

//delete tasks for user when user deletes itself

userSchema.pre('remove', async function(next){
    const user = this;
    await Task.deleteMany({owner:user._id});
    next();
    
})

const User = mongoose.model('User',userSchema);

module.exports = User;