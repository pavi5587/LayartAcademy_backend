# API Authentication Status

## Current State: NO APIs are protected with auth tokens

### User Routes (`/api/users`)
- ❌ `POST /login` - No Auth (should stay public)
- ❌ `POST /register` - No Auth (should stay public)
- ❌ `POST /google-login` - No Auth (should stay public)
- ❌ `POST /google-register` - No Auth (should stay public)
- ❌ `GET /users` - No Auth ⚠️ SHOULD BE PROTECTED
- ❌ `POST /forgot-password` - No Auth (should stay public)
- ❌ `POST /reset-password` - No Auth (should stay public)

### Course Routes (`/api/courses`)
- ❌ `POST /` - No Auth ⚠️ SHOULD BE PROTECTED (Admin only)
- ❌ `GET /` - No Auth (OK - public listing)
- ❌ `GET /:id` - No Auth (OK - public viewing)
- ❌ `PUT /:id` - No Auth ⚠️ SHOULD BE PROTECTED (Admin only)
- ❌ `DELETE /:id` - No Auth ⚠️ SHOULD BE PROTECTED (Admin only)
- ❌ `GET /title/:title` - No Auth (OK - public)

### Module Routes (`/api/modules`)
- ❌ `POST /` - No Auth ⚠️ SHOULD BE PROTECTED (Admin only)
- ❌ `GET /` - No Auth (OK - public)
- ❌ `GET /course/:courseName` - No Auth (OK - public)
- ❌ `PUT /:id` - No Auth ⚠️ SHOULD BE PROTECTED (Admin only)
- ❌ `DELETE /:id` - No Auth ⚠️ SHOULD BE PROTECTED (Admin only)

### Student Routes (`/api/students`)
- ❌ `POST /` - No Auth ⚠️ SHOULD BE PROTECTED
- ❌ `GET /` - No Auth ⚠️ SHOULD BE PROTECTED (Admin only)
- ❌ `GET /:id` - No Auth ⚠️ SHOULD BE PROTECTED
- ❌ `PUT /:id` - No Auth ⚠️ SHOULD BE PROTECTED
- ❌ `DELETE /:id` - No Auth ⚠️ SHOULD BE PROTECTED (Admin only)

### Video Routes (`/api/videos`)
- ❌ `POST /` - No Auth ⚠️ SHOULD BE PROTECTED (Admin only)
- ❌ `GET /` - No Auth (OK - public listing)
- ❌ `GET /:id` - No Auth (OK - public viewing)
- ❌ `PUT /:id` - No Auth ⚠️ SHOULD BE PROTECTED (Admin only)
- ❌ `DELETE /:id` - No Auth ⚠️ SHOULD BE PROTECTED (Admin only)

### Watch Progress Routes (`/api/watch-progress`)
- ❌ `GET /:userId/:courseId` - No Auth ⚠️ SHOULD BE PROTECTED
- ❌ `POST /save` - No Auth ⚠️ SHOULD BE PROTECTED
- ❌ `POST /complete` - No Auth ⚠️ SHOULD BE PROTECTED
- ❌ `GET /:userId/:courseId/resume` - No Auth ⚠️ SHOULD BE PROTECTED
- ❌ `GET /:userId/:courseId/stats` - No Auth ⚠️ SHOULD BE PROTECTED

### Watch History Routes (`/api/watch-history`)
- ❌ `POST /track` - No Auth ⚠️ SHOULD BE PROTECTED

### Contact Routes (`/api/contact`)
- ❌ `POST /` - No Auth (should stay public)
- ❌ `GET /` - No Auth ⚠️ SHOULD BE PROTECTED (Admin only)

---

## Summary
- **Public Routes (no auth needed)**: login, register, google-login, google-register, forgot-password, reset-password, course list, course details, modules list, contact form submission, video list, video details
- **Protected Routes (need auth)**: All POST/PUT/DELETE operations, user list, student management, watch progress tracking, watch history tracking, admin operations
