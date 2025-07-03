# WanderLanka Authentication Service

A microservice for handling user authentication and authorization in the WanderLanka application.

## 🚀 Features

- ✅ User registration with role-based access (Traveller/Guide)
- ✅ JWT-based authentication with access and refresh tokens
- ✅ Secure password hashing with bcrypt
- ✅ Input validation with Joi
- ✅ Rate limiting for security
- ✅ MongoDB integration with Mongoose
- ✅ TypeScript for type safety
- ✅ Comprehensive error handling

## 📋 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get current user profile

### Health Check
- `GET /health` - Service health check

## 🛠️ Installation

1. **Clone or copy this directory to your microservices repository**

2. **Install dependencies:**
```bash
npm install
```

3. **Environment setup:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB:**
```bash
# Using Docker
docker run -d -p 27017:27017 --name wanderlanka-mongo mongo

# Or install MongoDB locally
```

5. **Run the service:**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/wanderlanka-auth |
| `JWT_ACCESS_SECRET` | JWT access token secret | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - |
| `JWT_ACCESS_EXPIRY` | Access token expiry | 15m |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | 7d |
| `ALLOWED_ORIGINS` | CORS allowed origins | http://localhost:3000 |

## 📊 Database Schema

### User Model
```typescript
{
  username: string;      // Unique username
  email: string;         // Unique email
  password: string;      // Hashed password
  role: 'traveller' | 'guide';  // User role
  avatar?: string;       // Profile picture URL
  isActive: boolean;     // Account status
  emailVerified: boolean; // Email verification status
  refreshTokens: string[]; // Active refresh tokens
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Tokens**: Separate access and refresh tokens
- **Rate Limiting**: 5 auth attempts per 15 minutes
- **Input Validation**: Joi validation for all inputs
- **CORS Protection**: Configurable allowed origins
- **Helmet**: Security headers
- **Token Rotation**: Refresh token rotation on use

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📁 Project Structure

```
src/
├── controllers/          # Route controllers
│   └── AuthController.ts
├── middleware/          # Custom middleware
│   ├── auth.ts
│   └── rateLimit.ts
├── models/             # Database models
│   └── User.ts
├── routes/             # API routes
│   └── auth.ts
├── types/              # TypeScript types
│   └── index.ts
├── utils/              # Utility functions
│   ├── jwt.ts
│   └── validation.ts
└── index.ts            # Main server file
```

## 🚀 Deployment

1. **Build the project:**
```bash
npm run build
```

2. **Set production environment variables**

3. **Deploy to your preferred platform:**
   - AWS ECS/Fargate
   - Google Cloud Run
   - Azure Container Instances
   - Heroku
   - Railway

## 📝 API Usage Examples

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "role": "traveller"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john_doe",
    "password": "SecurePass123!"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Use conventional commits

## 📄 License

This project is licensed under the MIT License.
