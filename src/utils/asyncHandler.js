
//asyncHandler aisa funciton has which takes another fucnction as parameter and usko execute
//kar deta hai apne andar -HIGHER ORDER FUNCTION taki DB se jitne bhi kam hai sb yhi execute ho pae

const asyncHandler = (requestHandler) => {
    return (req,res,next)=>{
        Promise.resolve(
            requestHandler(req,res,next)
        ).catch((err)=> next(err))
    }
}










// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }

export {asyncHandler}