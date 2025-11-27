import { v2 as cloudinary } from 'cloudinary'
import { config } from './index.js'

const connectCloudinary = async () => {
    try {
        cloudinary.config({
            cloud_name: config.cloudinary.cloudName,
            api_key: config.cloudinary.apiKey,
            api_secret: config.cloudinary.secretKey
        })
        console.log('Cloudinary configured successfully')
    } catch (error) {
        console.error('Failed to configure Cloudinary:', error)
    }
}

export default connectCloudinary
export { cloudinary }
