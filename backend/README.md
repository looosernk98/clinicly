# Clinicly Backend API

A modern, scalable healthcare appointment booking system built with Node.js, Express, and MongoDB.

## 🏗️ Architecture

This backend follows a clean, layered architecture with clear separation of concerns:

```
backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
│   │
│   ├── config/
│   │   ├── index.js           # Centralized configuration
│   │   └── cloudinary.js      # Cloudinary setup
│   │
│   ├── database/
│   │   └── connection.js      # MongoDB connection
│   │
│   ├── routes/
│   │   ├── index.js           # Route aggregator
│   │   ├── user.routes.js     # User endpoints
│   │   ├── admin.routes.js    # Admin endpoints
│   │   └── doctor.routes.js   # Doctor endpoints
│   │
│   ├── controllers/
│   │   ├── user.controller.js
│   │   ├── admin.controller.js
│   │   └── doctor.controller.js
│   │
│   ├── services/              # Business logic layer
│   │   ├── auth.service.js
│   │   └── user.service.js
│   │
│   ├── repositories/          # Database access layer
│   │   ├── user.repo.js
│   │   └── appointment.repo.js
│   │
│   ├── models/
│   │   ├── user.model.js
│   │   ├── doctor.model.js
│   │   └── appointment.model.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── authAdmin.middleware.js
│   │   ├── authDoctor.middleware.js
│   │   └── multer.middleware.js
│   │
│   ├── utils/
│   │   ├── jwt.util.js
│   │   └── response.util.js
│   │
│   ├── validations/
│   │   └── user.validation.js
│   │
│   ├── constants/
│   │   ├── roles.js
│   │   └── statusCodes.js
│   │
│   ├── jobs/                  # Background jobs
│   │   └── email.job.js
│   │
│   └── emails/                # Email templates
│       └── welcomeEmail.html
│
├── public/                    # Static assets
├── tests/                     # Test files
├── scripts/                   # Utility scripts
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Cloudinary account

### Installation

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   # Fill in your environment variables
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Start the production server:
   \`\`\`bash
   npm start
   \`\`\`

### Available Scripts

- \`npm start\` - Start production server
- \`npm run dev\` - Start development server with nodemon
- \`npm run server\` - Alias for dev server
- \`npm run add-doctors\` - Run doctor seeding script
- \`npm run update-doctor-images\` - Update doctor images script

## 🏛️ Architecture Layers

### 1. **Routes Layer** (\`src/routes/\`)
- Defines API endpoints and HTTP methods
- Handles request routing and middleware binding
- Groups related endpoints logically

### 2. **Controllers Layer** (\`src/controllers/\`)
- Handles HTTP requests and responses
- Validates request data
- Calls appropriate services
- Formats responses

### 3. **Services Layer** (\`src/services/\`)
- Contains business logic
- Orchestrates operations between repositories
- Handles complex business rules
- Independent of HTTP concerns

### 4. **Repository Layer** (\`src/repositories/\`)
- Handles database operations
- Provides abstraction over data models
- Implements query logic
- Ensures data consistency

### 5. **Models Layer** (\`src/models/\`)
- Defines data schemas
- Handles validation rules
- Manages relationships between entities

## 📁 Key Directories

### Config (\`src/config/\`)
Centralized configuration management for:
- Database connections
- Third-party service configurations
- Environment-specific settings

### Middlewares (\`src/middlewares/\`)
Reusable middleware functions for:
- Authentication and authorization
- File upload handling
- Error handling
- Request validation

### Utils (\`src/utils/\`)
Common utility functions:
- JWT token management
- Response formatting
- Date/time helpers
- Validation utilities

### Constants (\`src/constants/\`)
Application constants:
- HTTP status codes
- User roles and permissions
- Application-specific enums

### Validations (\`src/validations/\`)
Input validation schemas:
- Request body validation
- Parameter validation
- Business rule validation

### Jobs (\`src/jobs/\`)
Background job handlers:
- Email notifications
- Scheduled tasks
- Batch processing

## 🔧 Configuration

The application uses a centralized configuration system in \`src/config/index.js\`:

- **Database**: MongoDB connection settings
- **Authentication**: JWT configuration
- **File Storage**: Cloudinary settings
- **Payment**: Stripe and Razorpay integration
- **CORS**: Cross-origin resource sharing settings

## 🗄️ Database Models

### User Model
- Personal information
- Authentication credentials
- Profile settings
- Appointment history

### Doctor Model
- Professional information
- Specializations
- Availability settings
- Fee structure

### Appointment Model
- Booking details
- Time slot management
- Payment tracking
- Status management

## 🔐 Authentication & Authorization

The system implements role-based authentication:

- **Users**: Can book appointments, manage profile
- **Doctors**: Can manage appointments, update availability
- **Admins**: Full system access, user management

## 📡 API Endpoints

### User Endpoints (\`/api/user\`)
- \`POST /register\` - User registration
- \`POST /login\` - User authentication
- \`GET /get-profile\` - Get user profile
- \`POST /update-profile\` - Update user profile
- \`POST /book-appointment\` - Book appointment
- \`GET /appointments\` - List user appointments
- \`POST /cancel-appointment\` - Cancel appointment

### Doctor Endpoints (\`/api/doctor\`)
- \`POST /login\` - Doctor authentication
- \`GET /appointments\` - List doctor appointments
- \`POST /cancel-appointment\` - Cancel appointment
- \`POST /complete-appointment\` - Mark as completed
- \`GET /dashboard\` - Doctor dashboard data

### Admin Endpoints (\`/api/admin\`)
- \`POST /login\` - Admin authentication
- \`POST /add-doctor\` - Add new doctor
- \`GET /all-doctors\` - List all doctors
- \`GET /appointments\` - List all appointments
- \`GET /dashboard\` - Admin dashboard data

## 🧪 Testing

Tests should be placed in the \`tests/\` directory following the same structure as the source code:

\`\`\`
tests/
├── unit/
│   ├── services/
│   ├── repositories/
│   └── utils/
├── integration/
│   └── routes/
└── fixtures/
```

## 📦 Dependencies

### Production Dependencies
- **express**: Web framework
- **mongoose**: MongoDB ODM
- **jsonwebtoken**: JWT authentication
- **bcrypt**: Password hashing
- **cloudinary**: Image upload service
- **stripe**: Payment processing
- **razorpay**: Payment processing
- **cors**: Cross-origin resource sharing
- **multer**: File upload handling

### Development Dependencies
- **nodemon**: Development server with auto-reload

## 🚀 Deployment

1. Build and deploy the application
2. Set production environment variables
3. Run database migrations if needed
4. Start the production server

## 📝 Contributing

1. Follow the established folder structure
2. Implement proper error handling
3. Add appropriate validation
4. Include unit tests for new features
5. Update documentation as needed

## 📄 License

This project is licensed under the ISC License.
