const express = require('express');
require("./db/mongoose"); //will make sure mongo db connects

const userRouter = require('./router/userRoute');
const taskRouter = require('./router/taskRoute');
const app = express();

const port = process.env.PORT;

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);


app.listen(port,()=>{
    console.log('Server is up on '+port);
});

