// require('dotenv').config({path: "./.env"});
import dotenv from "dotenv"

import connectDB from "./db/index.js";

dotenv.config({path:"./.env"})
connectDB();












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