# Portfolio API — shadrackkipkoech
### Backend Engineer | API Architect | System Design Enthusiast

> A production-grade RESTful API powering a full-stack developer portfolio.
> Built with Node.js, Express, MongoDB, JWT auth, and Multer file uploads.

---

## 📁 Project Structure

```
backend/
├── server.js               # Express app entry point
├── .env                    # Environment variables (not committed)
├── .env.example            # Template for env vars
├── package.json
│
├── config/
│   └── database.js         # MongoDB connection with retry logic
│
├── models/
│   ├── Admin.js            # Admin user (bcrypt password)
│   ├── Project.js          # Portfolio project
│   ├── Experience.js       # Work experience
│   ├── Contact.js          # Contact form messages
│   └── Visitor.js          # Visitor stats
│
├── controllers/
│   ├── authController.js   # Login, JWT, password change
│   ├── projectsController.js
│   ├── experienceController.js
│   ├── contactController.js
│   └── statsController.js
│
├── routes/
│   ├── auth.js
│   ├── projects.js
│   ├── experiences.js
│   ├── contact.js
│   ├── upload.js
│   └── stats.js
│
├── middleware/
│   ├── auth.js             # JWT protect + authorize
│   ├── errorHandler.js     # Centralized error handling
│   ├── validate.js         # express-validator rules
│   └── upload.js           # Multer config
│
├── utils/
│   ├── mailer.js           # Nodemailer email utility
│   └── seed.js             # Database seeder
│
└── uploads/                # Uploaded images (gitignored)
    ├── projects/
    ├── avatars/
    └── misc/
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Seed database
```bash
npm run seed
# Creates admin user + sample projects + experiences
```

### 4. Start server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000`

---

## 🔑 Authentication

All admin routes require a Bearer JWT token in the Authorization header:

```http
Authorization: Bearer <your_token>
```

Get a token by logging in:
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

---

## 📡 API Endpoints

### 🔐 Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/login` | Public | Admin login → JWT |
| GET | `/api/auth/me` | Private | Get current admin |
| POST | `/api/auth/logout` | Private | Logout |
| GET | `/api/auth/verify` | Private | Verify token |
| PUT | `/api/auth/change-password` | Private | Change password |

### 📂 Projects
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/projects` | Public | Get all visible projects |
| GET | `/api/projects/categories` | Public | Get unique categories |
| GET | `/api/projects/:id` | Public | Get project by ID or slug |
| GET | `/api/projects/admin/all` | Private | Get all (incl. hidden) |
| POST | `/api/projects` | Private | Create project |
| PUT | `/api/projects/:id` | Private | Update project |
| DELETE | `/api/projects/:id` | Private | Delete project |
| PATCH | `/api/projects/:id/toggle-featured` | Private | Toggle featured |
| PATCH | `/api/projects/:id/toggle-visible` | Private | Toggle visibility |

**Query params for GET /api/projects:**
- `page`, `limit` — Pagination
- `category` — Filter by category (api, backend, fullstack, database, devops)
- `featured=true` — Only featured projects
- `search` — Full-text search
- `tags` — Comma-separated tags
- `sort` — Sort field (default: `-createdAt`)

### 💼 Experiences
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/experiences` | Public | Get all visible |
| GET | `/api/experiences/:id` | Public | Get single |
| POST | `/api/experiences` | Private | Create |
| PUT | `/api/experiences/:id` | Private | Update |
| DELETE | `/api/experiences/:id` | Private | Delete |
| PATCH | `/api/experiences/:id/toggle-visible` | Private | Toggle visibility |
| PATCH | `/api/experiences/bulk/reorder` | Private | Bulk reorder |

### 📬 Contact
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/contact` | Public | Submit message (rate-limited: 5/hr) |
| GET | `/api/contact` | Private | Get all messages |
| GET | `/api/contact/stats` | Private | Message analytics |
| GET | `/api/contact/:id` | Private | Get single + mark read |
| PATCH | `/api/contact/:id/status` | Private | Update status |
| PATCH | `/api/contact/:id/notes` | Private | Add admin notes |
| DELETE | `/api/contact/:id` | Private | Delete message |

### 📤 Upload
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/upload/project-images` | Private | Upload up to 10 images |
| POST | `/api/upload/avatar` | Private | Upload single avatar |
| POST | `/api/upload/single` | Private | Upload any single file |
| DELETE | `/api/upload` | Private | Delete uploaded file |
| GET | `/api/upload/list?folder=projects` | Private | List uploaded files |

### 📊 Stats
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/stats/visit` | Public | Record page visit |
| GET | `/api/stats/dashboard` | Private | Dashboard analytics |
| GET | `/api/stats/visitors?days=30` | Private | Visitor stats |

### 🏥 Health
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/health` | Public | Health check |
| GET | `/api` | Public | API info |

---

## 🛡️ Security Features

- **Helmet** — Secure HTTP headers
- **CORS** — Configurable allowed origins
- **Rate Limiting** — Global (100 req/15min) + Auth (10 req/15min) + Contact (5/hr)
- **JWT** — Signed tokens with expiry
- **bcrypt** — Password hashing (salt rounds: 12)
- **Account Lockout** — 5 failed attempts → 30-min lock
- **Input Validation** — express-validator on all routes
- **File Type Validation** — MIME type check on uploads
- **Path Traversal Protection** — Sanitized file paths

---

## 🗄️ Database Schema

### Admin
```js
{ username, email, password (hashed), role, isActive, lastLogin, loginAttempts, lockUntil }
```

### Project
```js
{ title, slug, description, shortDescription, category, techStack[], tags[],
  images[], imageUrl, githubLink, liveLink, featured, visible, order,
  completedAt, metrics: { stars, forks, views } }
```

### Experience
```js
{ role, company, companyUrl, location, employmentType,
  startDate, endDate, isCurrent, duration,
  responsibilities[], technologies[], achievements[], visible, order }
```

### Contact
```js
{ name, email, phone, projectType, budget, message, collaboration,
  status, ipAddress, userAgent, repliedAt, adminNotes }
```

---

## 🚢 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/portfolio
JWT_SECRET=<strong-random-64-char-secret>
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password
ALLOWED_ORIGINS=https://yourdomain.com
```

### Deploy to Railway / Render / Heroku
```bash
# Railway
railway login && railway up

# Render — connect GitHub repo, set env vars in dashboard

# Heroku
heroku create portfolio-api
heroku config:set NODE_ENV=production ...
git push heroku main
```

### Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name api.alexoduya.dev;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🧪 Testing with curl

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get projects
curl http://localhost:5000/api/projects

# Create project (with token)
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My API","description":"A great API","category":"api","techStack":["Python","Django"]}'

# Submit contact form
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","message":"Hello Alex!"}'
```

---

## 📝 License
MIT © 2026 shadrack kipkoech
