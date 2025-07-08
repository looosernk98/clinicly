import jwt from 'jsonwebtoken'

// user authentication middleware
const authUser = async (req, res, next) => {
    const { token } = req.headers
    console.log("token", token)
    if (!token) {
        return res.json({ success: false, message: 'Not Authorized Login Again' })
    }
    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        console.log("token_decode", token_decode)
        req.body.userId = token_decode.id
        next()
    } catch (error) {
        console.log("error in authUser", error)
        res.json({ success: false, message: error.message })
    }
}

export default authUser;