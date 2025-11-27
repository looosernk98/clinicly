// Example job for handling email notifications
// This would typically work with a job queue like Bull, Agenda, or similar

class EmailJob {
    // Send welcome email to new users
    async sendWelcomeEmail(userData) {
        try {
            console.log(`📧 Sending welcome email to: ${userData.email}`)
            
            // Here you would integrate with your email service
            // Example: SendGrid, Mailgun, AWS SES, etc.
            
            const emailTemplate = this.getWelcomeEmailTemplate(userData.name)
            
            // Mock email sending
            console.log('✅ Welcome email sent successfully')
            
            return {
                success: true,
                message: 'Welcome email sent',
                recipient: userData.email
            }
        } catch (error) {
            console.error('❌ Failed to send welcome email:', error)
            throw error
        }
    }

    // Send appointment confirmation email
    async sendAppointmentConfirmation(appointmentData) {
        try {
            const { userData, docData, slotDate, slotTime } = appointmentData
            
            console.log(`📧 Sending appointment confirmation to: ${userData.email}`)
            
            const emailTemplate = this.getAppointmentConfirmationTemplate({
                patientName: userData.name,
                doctorName: docData.name,
                appointmentDate: slotDate,
                appointmentTime: slotTime
            })
            
            console.log('✅ Appointment confirmation email sent successfully')
            
            return {
                success: true,
                message: 'Appointment confirmation sent',
                recipient: userData.email
            }
        } catch (error) {
            console.error('❌ Failed to send appointment confirmation:', error)
            throw error
        }
    }

    // Send appointment reminder email
    async sendAppointmentReminder(appointmentData) {
        try {
            const { userData, docData, slotDate, slotTime } = appointmentData
            
            console.log(`📧 Sending appointment reminder to: ${userData.email}`)
            
            // This would typically be triggered by a cron job
            // that checks for appointments happening in the next 24 hours
            
            console.log('✅ Appointment reminder email sent successfully')
            
            return {
                success: true,
                message: 'Appointment reminder sent',
                recipient: userData.email
            }
        } catch (error) {
            console.error('❌ Failed to send appointment reminder:', error)
            throw error
        }
    }

    // Get welcome email template
    getWelcomeEmailTemplate(userName) {
        return {
            subject: 'Welcome to Clinicly!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to Clinicly, ${userName}!</h2>
                    <p>Thank you for joining our healthcare platform.</p>
                    <p>You can now book appointments with our qualified doctors.</p>
                    <a href="${process.env.FRONTEND_URL}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Get Started
                    </a>
                </div>
            `
        }
    }

    // Get appointment confirmation email template
    getAppointmentConfirmationTemplate(data) {
        return {
            subject: 'Appointment Confirmation - Clinicly',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Appointment Confirmed!</h2>
                    <p>Dear ${data.patientName},</p>
                    <p>Your appointment has been confirmed with the following details:</p>
                    <ul>
                        <li><strong>Doctor:</strong> ${data.doctorName}</li>
                        <li><strong>Date:</strong> ${data.appointmentDate}</li>
                        <li><strong>Time:</strong> ${data.appointmentTime}</li>
                    </ul>
                    <p>Please arrive 15 minutes early for your appointment.</p>
                </div>
            `
        }
    }
}

export default new EmailJob()
