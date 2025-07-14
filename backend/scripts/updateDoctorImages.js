import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function updateDoctorImages() {
    try {
        console.log('🚀 Starting doctor image updates...');
        
        // First, login as admin to get the token
        console.log('📝 Logging in as admin...');
        const loginResponse = await axios.post(`${BACKEND_URL}/api/admin/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        if (!loginResponse.data.success) {
            throw new Error('Admin login failed: ' + loginResponse.data.message);
        }

        const adminToken = loginResponse.data.token;
        console.log('✅ Admin login successful');

        // Call the update doctor images API
        console.log('🖼️  Updating doctor images...');
        const updateResponse = await axios.post(`${BACKEND_URL}/api/admin/update-doctor-images`, {}, {
            headers: {
                'aToken': adminToken
            }
        });

        if (updateResponse.data.success) {
            console.log('✅ Success:', updateResponse.data.message);
            console.log(`📊 Updated: ${updateResponse.data.updatedCount} doctors`);
            console.log(`⏭️  Skipped: ${updateResponse.data.skippedCount} doctors`);
        } else {
            console.error('❌ Error:', updateResponse.data.message);
        }

    } catch (error) {
        console.error('❌ Script failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the script
updateDoctorImages(); 