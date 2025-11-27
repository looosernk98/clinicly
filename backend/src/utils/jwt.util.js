import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'

export const generateToken = (payload, expiresIn = config.jwt.expiresIn) => {
    return jwt.sign(payload, config.jwt.secret, { expiresIn })
}

export const verifyToken = (token) => {
    return jwt.verify(token, config.jwt.secret)
}

export const decodeToken = (token) => {
    return jwt.decode(token)
}

export default {
    generateToken,
    verifyToken,
    decodeToken
}
