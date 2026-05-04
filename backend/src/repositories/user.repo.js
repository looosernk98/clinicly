import userModel from '../models/user.model.js'

class UserRepository {
    // Create a new user
    async create(userData) {
        const user = new userModel(userData)
        return await user.save()
    }

    // Find user by ID
    async findById(userId, selectFields = null) {
        const query = userModel.findById(userId)
        if (selectFields) {
            query.select(selectFields)
        }
        return await query
    }

    // Find user by email
    async findByEmail(email) {
        return await userModel.findOne({ email })
    }

    // Update user by ID
    async updateById(userId, updateData) {
        return await userModel.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true, runValidators: true }
        )
    }

    // Delete user by ID
    async deleteById(userId) {
        return await userModel.findByIdAndDelete(userId)
    }

    // Find users with filters
    async findWithFilters(filters, options = {}) {
        const { page = 1, limit = 10, sort = { created_at: -1 } } = options
        const skip = (page - 1) * limit

        const query = userModel.find(filters)
            .sort(sort)
            .skip(skip)
            .limit(limit)

        return await query
    }

    // Count users with filters
    async countWithFilters(filters) {
        return await userModel.countDocuments(filters)
    }

    // Check if user exists by email
    async existsByEmail(email) {
        const count = await userModel.countDocuments({ email })
        return count > 0
    }

    // Get all users (with pagination)
    async findAll(page = 1, limit = 10) {
        const skip = (page - 1) * limit
        return await userModel.find({})
            .select('-password_hash')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
    }
}

export default new UserRepository()
