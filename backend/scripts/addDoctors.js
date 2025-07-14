import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function addDoctors() {
    try {
        console.log('🚀 Starting bulk doctor addition...');
        
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

        // Call the bulk add doctors API
        console.log('👨‍⚕️ Adding doctors to database...');
        const addDoctorsResponse = await axios.post(`${BACKEND_URL}/api/admin/bulk-add-doctors`, {}, {
            headers: {
                'aToken': adminToken
            }
        });

        if (addDoctorsResponse.data.success) {
            console.log('✅ Success:', addDoctorsResponse.data.message);
            console.log(`📊 Added: ${addDoctorsResponse.data.addedCount} doctors`);
            console.log(`⏭️  Skipped: ${addDoctorsResponse.data.skippedCount} doctors (already exist)`);
        } else {
            console.error('❌ Error:', addDoctorsResponse.data.message);
        }

    } catch (error) {
        console.error('❌ Script failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the script
addDoctors(); 