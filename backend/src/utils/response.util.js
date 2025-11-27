import { HTTP_STATUS, APP_STATUS } from '../constants/statusCodes.js'

export const successResponse = (res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) => {
    return res.status(statusCode).json({
        success: true,
        status: APP_STATUS.SUCCESS,
        message,
        data,
        timestamp: new Date().toISOString()
    })
}

export const errorResponse = (res, message = 'Internal Server Error', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) => {
    return res.status(statusCode).json({
        success: false,
        status: APP_STATUS.ERROR,
        message,
        errors,
        timestamp: new Date().toISOString()
    })
}

export const validationErrorResponse = (res, errors, message = 'Validation Failed') => {
    return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST, errors)
}

export const unauthorizedResponse = (res, message = 'Unauthorized') => {
    return errorResponse(res, message, HTTP_STATUS.UNAUTHORIZED)
}

export const notFoundResponse = (res, message = 'Resource not found') => {
    return errorResponse(res, message, HTTP_STATUS.NOT_FOUND)
}

export default {
    successResponse,
    errorResponse,
    validationErrorResponse,
    unauthorizedResponse,
    notFoundResponse
}
