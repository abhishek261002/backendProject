import express, { urlencoded } from "express"
import cookieParser from "cookie-parser";
import cors from "cors"
const app= express();
const allowedOrigins = ['http://localhost:5173'];
app.use(cors({
    origin: [ 'http://localhost:5173'],
    credentials:true
}))

app.use(express.json({
    limit:"16kb"
}))

app.use(express.urlencoded({extended:true,
     limit : "16kb" }))

app.use(express.static("public"))

app.use(cookieParser())


//routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js"
import likeRouter from "./routes/like.routes.js"
import commentRouter from "./routes/comment.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriberRouter from "./routes/subscription.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
//routes declaration

app.use("/api/v1/users", userRouter)
app.use("/api/v1/video", videoRouter)
app.use("/api/v1/like", likeRouter)
app.use("/api/v1/comment", commentRouter)
app.use("/api/v1/tweet", tweetRouter)
app.use("/api/v1/subscription", subscriberRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)
//URL EXAMPLE - http//localhost:8000/api/v1/users/register
export {app} 