# APPC-M Password Security Enhancement Plan

## Current Security Assessment

### Vulnerabilities Identified:
1. **Hardcoded SHA-256 hashes** in client-side code
2. **No password salting** - vulnerable to rainbow table attacks
3. **Single iteration hashing** - fast to brute force
4. **No rate limiting** - unlimited brute force attempts
5. **Client-side only validation** - can be bypassed
6. **Same hash across files** - security through obscurity
7. **No session management** - permanent access once unlocked

## Enhanced Security Implementation

### Files Created:
1. **`auth.js`** - Centralized authentication system with:
   - PBKDF2-HMAC-SHA-256 with configurable iterations
   - Unique salt per password
   - Rate limiting (5 attempts, 15-minute lockout)
   - Session management (30-minute timeout)
   - Password complexity validation
   - Password change functionality

2. **`enhanced-hash.html`** - Secure hash generator with:
   - PBKDF2 hash generation
   - Password strength meter
   - Random salt generation
   - Configurable iteration count

3. **`auth-migration-template.js`** - Migration guide for updating HTML files

## Implementation Steps

### Phase 1: Generate New Secure Passwords
1. Open `enhanced-hash.html` in browser
2. Enter a strong password (12+ chars, mixed case, numbers, symbols)
3. Generate hash with recommended 100,000 iterations
4. Copy the JSON output

### Phase 2: Update Authentication Configuration
For each HTML file (index.html, simulation files, etc.):

1. **Add auth.js reference:**
   ```html
   <script src="../auth.js"></script>
   ```

2. **Replace hardcoded hash with PBKDF2 config:**
   ```javascript
   const AUTH_CONFIG = {
     hash: "generated_hash_here",
     salt: "generated_salt_here", 
     iterations: 100000,
     algorithm: "PBKDF2-HMAC-SHA-256"
   };
   ```

3. **Update verification function** to use new auth system with rate limiting

### Phase 3: Deploy Enhanced Security
1. **Different passwords per environment:**
   - Development: Use simpler passwords
   - Production: Use strong, unique passwords

2. **HTTPS enforcement** (for production):
   - Require HTTPS
   - Set HSTS headers
   - Use secure cookies

3. **Regular password rotation:**
   - Change passwords every 90 days
   - Use password manager for strong passwords

## Security Features Implemented

### 1. Strong Password Hashing
- **PBKDF2-HMAC-SHA-256** instead of plain SHA-256
- **100,000 iterations** (configurable up to 500,000)
- **Unique 16-byte salt** per password
- **256-bit output** (32 bytes)

### 2. Rate Limiting
- **5 failed attempts** maximum
- **15-minute lockout** after max attempts
- **Exponential backoff** consideration
- **LocalStorage tracking** of attempts

### 3. Session Management
- **30-minute session timeout**
- **Automatic session extension** with activity
- **Session validation** on page refresh
- **Clean session termination**

### 4. Password Requirements
- **Minimum 12 characters**
- **Uppercase and lowercase letters**
- **Numbers and special characters**
- **No common passwords**

### 5. Defense Against Attacks
- **Rainbow tables:** Salt prevents precomputed attacks
- **Brute force:** Rate limiting slows attacks
- **Timing attacks:** Constant-time comparison
- **Client-side bypass:** Server-side validation recommended for production

## Migration Strategy

### Quick Migration (Minimum Changes):
1. Update main `index.html` with new auth system
2. Keep simulation files with current system temporarily
3. Gradually update simulation files

### Complete Migration:
1. Batch update all HTML files using migration script
2. Test each simulation after update
3. Deploy in stages

## Production Recommendations

### 1. Server-Side Validation (Recommended)
```javascript
// For maximum security, add server-side validation
async function validateServerSide(password) {
  const response = await fetch('/api/validate', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({password: password})
  });
  return response.ok;
}
```

### 2. Environment Variables
- Store passwords in environment variables
- Use different passwords for dev/staging/prod
- Never commit passwords to git

### 3. Monitoring & Logging
- Log failed login attempts
- Monitor for brute force patterns
- Alert on suspicious activity

### 4. Regular Security Audits
- Review password strength quarterly
- Update iteration count annually
- Test rate limiting functionality

## Testing the Implementation

1. **Test valid login:** Should grant access
2. **Test invalid password:** Should show remaining attempts
3. **Test rate limiting:** 5 failures should lock account
4. **Test session timeout:** Should require re-login after 30 minutes
5. **Test password strength:** Weak passwords should be rejected

## Fallback Plan

If issues arise during migration:
1. Keep backup of original files
2. Test on staging environment first
3. Roll back changes if authentication fails
4. Use feature flags for gradual rollout

## Estimated Time
- **Initial setup:** 2-4 hours
- **File updates:** 1-2 hours per 10 files  
- **Testing:** 2-3 hours
- **Total:** 5-9 hours for complete migration

## Next Steps
1. Generate new secure passwords using enhanced-hash.html
2. Update main index.html as template
3. Test authentication flow
4. Batch update simulation files
5. Deploy to production environment