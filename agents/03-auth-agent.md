# HireOn — Auth Agent

## Role
You are the **Custom Authentication Agent** for HireOn. Your job is to implement a complete, secure, production-grade JWT authentication system from scratch — no Supabase, no Passport, no third-party auth provider. Pure custom implementation using bcrypt + JWT with refresh token rotation.

---

## Project Context

**Auth Strategy:** Custom JWT (Access Token + Refresh Token)  
**Password Hashing:** bcrypt (10 rounds)  
**Access Token TTL:** 15 minutes  
**Refresh Token TTL:** 7 days  
**Token Storage (frontend):** Access token in memory (Zustand), Refresh token in HTTP-only cookie  
**Roles:** `HR` | `INTERVIEWER` | `CANDIDATE`  
**Database:** Neon PostgreSQL via Prisma — `Users` table stores `refreshToken` (hashed)

---

## Files To Generate

```
Backend:
├── src/utils/jwt.ts
├── src/utils/hash.ts
├── src/middlewares/auth.middleware.ts
├── src/middlewares/role.middleware.ts
├── src/controllers/auth.controller.ts
├── src/services/auth.service.ts
├── src/routes/auth.routes.ts
└── src/types/express.d.ts

Frontend:
├── src/store/authStore.ts
├── src/services/auth.service.ts
├── src/hooks/useAuth.ts
├── src/app/(auth)/login/page.tsx
├── src/app/(auth)/register/page.tsx
└── src/middleware.ts
```

---

## Backend Implementation

### `src/utils/jwt.ts`

Implement these four functions:

```ts
generateAccessToken(payload: JWTPayload): string
generateRefreshToken(payload: JWTPayload): string
verifyAccessToken(token: string): JWTPayload
verifyRefreshToken(token: string): JWTPayload
```

Where `JWTPayload`:
```ts
interface JWTPayload {
  id: string
  email: string
  role: 'HR' | 'INTERVIEWER' | 'CANDIDATE'
}
```

- Use `jsonwebtoken`
- Read secrets from `process.env.JWT_SECRET` and `process.env.JWT_REFRESH_SECRET`
- Throw typed errors: `TokenExpiredError`, `InvalidTokenError`
- Never use `algorithm: 'none'`
- Use `HS256` algorithm

---

### `src/utils/hash.ts`

```ts
hashPassword(plain: string): Promise<string>       // bcrypt, 10 rounds
comparePassword(plain: string, hash: string): Promise<boolean>
hashToken(token: string): string                   // SHA-256 for refresh token storage
```

Store only the SHA-256 hash of the refresh token in DB — never the raw token.

---

### `src/types/express.d.ts`

Extend Express Request:
```ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: 'HR' | 'INTERVIEWER' | 'CANDIDATE'
      }
    }
  }
}
```

---

### `src/middlewares/auth.middleware.ts`

Implement `authenticate` middleware:

1. Extract token from `Authorization: Bearer <token>` header
2. If missing → `401 No token provided`
3. Verify using `verifyAccessToken`
4. If expired → `401 Token expired`
5. If invalid → `401 Invalid token`
6. Attach decoded payload to `req.user`
7. Call `next()`

---

### `src/middlewares/role.middleware.ts`

```ts
export const requireRole = (...roles: Role[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json(...)
    if (!roles.includes(req.user.role)) return res.status(403).json(...)
    next()
  }
}
```

Usage examples:
```ts
router.get('/hr/dashboard', authenticate, requireRole('HR'), ...)
router.get('/interviewer/schedule', authenticate, requireRole('INTERVIEWER'), ...)
router.post('/candidate/apply', authenticate, requireRole('CANDIDATE'), ...)
```

---

### `src/services/auth.service.ts`

Implement these methods:

#### `register(data: RegisterDTO)`
1. Check if email already exists → throw `EmailAlreadyExistsError`
2. Hash password
3. Create `Users` record
4. If role is CANDIDATE, also create `Candidates` record
5. Generate access + refresh tokens
6. Hash refresh token and save to `Users.refreshToken`
7. Return `{ user, accessToken, refreshToken }`

#### `login(data: LoginDTO)`
1. Find user by email → throw `InvalidCredentialsError` if not found
2. Compare password → throw `InvalidCredentialsError` if mismatch
3. Check `isActive` → throw `AccountDeactivatedError` if false
4. Generate new access + refresh tokens
5. Hash and save new refresh token
6. Return `{ user, accessToken, refreshToken }`

#### `refreshTokens(rawRefreshToken: string)`
1. Verify refresh token signature
2. Hash the raw token
3. Find user where `refreshToken === hash`
4. If not found → `InvalidRefreshTokenError` (rotation violation)
5. Generate new access + refresh tokens
6. Update `Users.refreshToken` with new hash (rotation)
7. Return `{ accessToken, refreshToken }`

#### `logout(userId: string)`
1. Set `Users.refreshToken = null`
2. Return success

#### `getMe(userId: string)`
1. Find user by ID
2. Return user without `passwordHash` and `refreshToken`

---

### `src/controllers/auth.controller.ts`

Implement:
- `POST /auth/register` → calls `authService.register`
- `POST /auth/login` → calls `authService.login`, sets refresh token in HTTP-only cookie
- `POST /auth/refresh` → reads refresh token from cookie, calls `authService.refreshTokens`
- `POST /auth/logout` → clears cookie, calls `authService.logout`
- `GET /auth/me` → `authenticate` middleware required, calls `authService.getMe`

Cookie config for refresh token:
```ts
res.cookie('hireon_refresh_token', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth/refresh'
})
```

---

### `src/routes/auth.routes.ts`

```ts
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout    (requires authenticate)
GET    /api/auth/me        (requires authenticate)
```

---

### Zod Validation Schemas

```ts
const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['HR', 'INTERVIEWER', 'CANDIDATE'])
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})
```

---

## Frontend Implementation

### `src/store/authStore.ts`

Zustand store with persistence:

```ts
interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  
  setAuth: (user: User, accessToken: string) => void
  clearAuth: () => void
  setAccessToken: (token: string) => void
}
```

Use `persist` middleware with `localStorage`. Store only `user` and `accessToken`. The refresh token lives in the HTTP-only cookie — never in JS-accessible storage.

---

### `src/services/auth.service.ts` (frontend)

```ts
register(data: RegisterDTO): Promise<AuthResponse>
login(data: LoginDTO): Promise<AuthResponse>
logout(): Promise<void>
getMe(): Promise<User>
refreshTokens(): Promise<{ accessToken: string }>
```

All calls go to `NEXT_PUBLIC_API_BASE_URL`. The refresh call should be called silently when a 401 is intercepted.

---

### `src/services/api.ts` — Axios interceptors

Set up response interceptor:
1. On `401` response, attempt silent token refresh via `/auth/refresh`
2. If refresh succeeds: update `authStore.accessToken`, retry original request
3. If refresh fails: call `clearAuth()`, redirect to `/login`
4. Use a `isRefreshing` flag + request queue to prevent multiple simultaneous refresh calls

---

### `src/middleware.ts` (Next.js)

Protect routes based on role:
```ts
// Protected route map:
/hr/*         → requires role: HR
/interviewer/* → requires role: INTERVIEWER
/candidate/*  → requires role: CANDIDATE

// Public routes (no auth):
/login, /register, /
```

Read JWT from `Authorization` header or decode from cookie. If role mismatch → redirect to their correct dashboard. If unauthenticated → redirect to `/login`.

---

### Login Page `src/app/(auth)/login/page.tsx`

- React Hook Form + Zod resolver
- Fields: email, password
- On submit: call `authService.login`
- On success: call `authStore.setAuth`, redirect based on role:
  - HR → `/hr`
  - INTERVIEWER → `/interviewer`
  - CANDIDATE → `/candidate`
- Show loading spinner during submission
- Show error toast on failure
- Link to register page

---

### Register Page `src/app/(auth)/register/page.tsx`

- Fields: name, email, password, confirm password, role (select)
- Role selector must show: "I'm hiring (HR)", "I'm an interviewer", "I'm applying"
- Password confirmation must match
- On success: auto-login and redirect

---

## Security Checklist

- [ ] Passwords never logged or returned in API responses
- [ ] Refresh token stored as SHA-256 hash in DB
- [ ] HTTP-only cookie used for refresh token
- [ ] Access token expires in 15 minutes
- [ ] Refresh token rotated on every use (old token invalidated)
- [ ] Role enforcement on every protected route (both middleware + DB check)
- [ ] Rate limiting on `/auth/login` (5 requests per 15 min per IP)
- [ ] CORS configured to allow only frontend origin in production
- [ ] `isActive` check on every login

---

## Error Types

Define these custom error classes in `src/utils/errors.ts`:

```ts
class EmailAlreadyExistsError extends Error {}
class InvalidCredentialsError extends Error {}
class AccountDeactivatedError extends Error {}
class InvalidRefreshTokenError extends Error {}
class TokenExpiredError extends Error {}
class InvalidTokenError extends Error {}
class UnauthorizedError extends Error {}
class ForbiddenError extends Error {}
```

The global error middleware (`error.middleware.ts`) must map these to correct HTTP status codes.
