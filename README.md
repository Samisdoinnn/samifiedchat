# 💬 Samified Chat - Real-time Chat Application

> A production-ready, full-stack real-time chat application built with the MERN stack

**Repository**: https://github.com/Samisdoinnn/samifiedchat

---

## 🚀 Features

- 🔐 **Secure Authentication** - JWT-based authentication with httpOnly cookies
- 💬 **Real-time Messaging** - Instant messaging powered by Socket.io
- 🟢 **Online Status** - See who's online in real-time
- 📸 **Image Sharing** - Upload and share images via Cloudinary
- 🎨 **Modern UI** - Beautiful interface with TailwindCSS + DaisyUI
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🌙 **Theme Support** - Multiple theme options
- ⚡ **State Management** - Efficient global state with Zustand

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database and ODM
- **Socket.io** - Real-time bidirectional communication
- **JWT** - Secure authentication
- **Cloudinary** - Image upload and storage
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **TailwindCSS** + **DaisyUI** - Styling
- **Socket.io Client** - Real-time updates

---

## ⚙️ Environment Setup

Create a `.env` file in the `backend` directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Server
PORT=5001
NODE_ENV=development

# Authentication
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> ⚠️ **Security Note**: Never commit your `.env` file. Use strong, randomly generated secrets in production.

---

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- npm or yarn

### Install Dependencies

```bash
# Install all dependencies (backend + frontend)
npm run build
```

Or install separately:

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

---

## 🚀 Running the Application

### Development Mode

```bash
# Run backend (from backend directory)
cd backend
npm run dev

# Run frontend (from frontend directory)
cd frontend
npm run dev
```

### Production Mode

```bash
# Build and start (from root directory)
npm run build
npm start
```

The application will be available at:
- Frontend: `http://localhost:5173` (development)
- Backend API: `http://localhost:5001`

---

## 📁 Project Structure

```
samifiedchat/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── lib/             # Utilities and config
│   │   └── index.js         # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand stores
│   │   ├── lib/             # Utilities
│   │   └── App.jsx          # Root component
│   └── package.json
└── package.json             # Root package.json
```

---

## 🔒 Security Features

- ✅ JWT authentication with httpOnly cookies
- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ CORS configuration
- ✅ Environment variable protection
- ✅ Input validation (basic)

**Recommended Enhancements** (see `SECURITY_ANALYSIS.md`):
- Add rate limiting
- Implement security headers (helmet.js)
- Add input sanitization
- Enable CSRF protection

---

## 📊 Code Quality

This project includes comprehensive analysis reports:

- **[Architecture Analysis](ARCHITECTURE_ANALYSIS.md)** - MVC pattern evaluation
- **[Runtime Analysis](RUNTIME_ANALYSIS.md)** - Edge cases and stability
- **[Security Analysis](SECURITY_ANALYSIS.md)** - OWASP-compliant security audit
- **[Cross-Platform Analysis](CROSS_PLATFORM_ANALYSIS.md)** - Platform compatibility
- **[Summary Report](README_ANALYSIS.md)** - Consolidated findings

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Samisdoinnn**
- GitHub: [@Samisdoinnn](https://github.com/Samisdoinnn)
- Repository: [samifiedchat](https://github.com/Samisdoinnn/samifiedchat)

---

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by real-world chat applications
- Community-driven development

---

**⭐ If you find this project useful, please consider giving it a star!**

