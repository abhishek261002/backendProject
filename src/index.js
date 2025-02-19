// require('dotenv').config({path: "./.env"});
import dotenv from "dotenv"

import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({path:"./.env"})
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 4000,'0.0.0.0', ()=>{
        console.log("server running on port " , process.env.PORT);
    })
    app.on("errror",(error)=>{
        console.log("ERRR : ",error);
        throw error;
    })
    app.get("/",(req,res)=>{
        res.send("api running")
    })
})
.catch((error)=>{
    console.log("MONGODB CONNECTION FAILED :index.js " ,error);
})












//not the best approach

// import mongoose from "mongoose"
// import { DB_NAME } from "./constants";

// (async()=>{
//     try {
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`,{
//         useNewUrlParser:true,
//         useUnifiedTopology:true
//        })
//     } catch (error) {
//        console.log("error in fetching db " ,error);
//     }
// })()