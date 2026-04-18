/**
 * Enhanced Authentication System for APPC-M
 * Uses PBKDF2 with salt, rate limiting, and session management
 */

class AuthSystem {
    constructor() {
        this.STORAGE_KEY = 'appc_auth';
        this.RATE_LIMIT_KEY = 'appc_rate_limit';
        this.SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
        this.MAX_ATTEMPTS = 5;
        this.LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
        this.PBKDF2_ITERATIONS = 100000;
        this.PBKDF2_KEYLEN = 32; // 256 bits
    }

    // Generate a random salt
    async generateSalt(length = 16) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // PBKDF2-HMAC-SHA-256 password hashing
    async hashPassword(password, salt = null) {
        if (!salt) {
            salt = await this.generateSalt();
        }
        
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        const saltBuffer = encoder.encode(salt);
        
        // Import password as key
        const key = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );
        
        // Derive key using PBKDF2
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: saltBuffer,
                iterations: this.PBKDF2_ITERATIONS,
                hash: 'SHA-256'
            },
            key,
            this.PBKDF2_KEYLEN * 8
        );
        
        // Convert to hex
        const hashArray = Array.from(new Uint8Array(derivedBits));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return {
            hash: hashHex,
            salt: salt,
            iterations: this.PBKDF2_ITERATIONS
        };
    }

    // Verify password against stored hash
    async verifyPassword(password, storedHash, salt, iterations = this.PBKDF2_ITERATIONS) {
        const { hash } = await this.hashPassword(password, salt);
        return hash === storedHash;
    }

    // Rate limiting
    checkRateLimit() {
        const rateData = JSON.parse(localStorage.getItem(this.RATE_LIMIT_KEY) || '{"attempts": 0, "lockoutUntil": 0}');
        const now = Date.now();
        
        // Check if locked out
        if (rateData.lockoutUntil > now) {
            const remainingMinutes = Math.ceil((rateData.lockoutUntil - now) / 60000);
            throw new Error(`Account locked. Try again in ${remainingMinutes} minute(s).`);
        }
        
        // Reset attempts if lockout period has passed
        if (rateData.attempts >= this.MAX_ATTEMPTS && rateData.lockoutUntil <= now) {
            rateData.attempts = 0;
            rateData.lockoutUntil = 0;
        }
        
        return rateData;
    }

    updateRateLimit(success) {
        const rateData = this.checkRateLimit();
        
        if (success) {
            // Reset on successful login
            rateData.attempts = 0;
            rateData.lockoutUntil = 0;
        } else {
            // Increment failed attempts
            rateData.attempts++;
            
            // Lock out if max attempts reached
            if (rateData.attempts >= this.MAX_ATTEMPTS) {
                rateData.lockoutUntil = Date.now() + this.LOCKOUT_TIME;
            }
        }
        
        localStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify(rateData));
        return rateData;
    }

    // Session management
    createSession(userId) {
        const session = {
            userId: userId,
            created: Date.now(),
            expires: Date.now() + this.SESSION_TIMEOUT,
            sessionId: this.generateSessionId()
        };
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
        return session;
    }

    getSession() {
        const sessionData = localStorage.getItem(this.STORAGE_KEY);
        if (!sessionData) return null;
        
        const session = JSON.parse(sessionData);
        const now = Date.now();
        
        // Check if session expired
        if (session.expires < now) {
            this.clearSession();
            return null;
        }
        
        // Auto-extend session if less than 5 minutes left
        if (session.expires - now < 5 * 60 * 1000) {
            session.expires = now + this.SESSION_TIMEOUT;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
        }
        
        return session;
    }

    clearSession() {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    isAuthenticated() {
        return this.getSession() !== null;
    }

    // Password complexity validation
    validatePassword(password) {
        const errors = [];
        
        if (password.length < 12) {
            errors.push('Password must be at least 12 characters long');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        
        // Check for common passwords (simplified)
        const commonPasswords = ['password', '123456', 'qwerty', 'letmein', 'welcome'];
        if (commonPasswords.includes(password.toLowerCase())) {
            errors.push('Password is too common');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // Generate session ID
    generateSessionId() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Password change functionality
    async changePassword(currentPassword, newPassword, confirmPassword, storedHash, salt) {
        // Verify current password
        const currentValid = await this.verifyPassword(currentPassword, storedHash, salt);
        if (!currentValid) {
            throw new Error('Current password is incorrect');
        }
        
        // Check if new passwords match
        if (newPassword !== confirmPassword) {
            throw new Error('New passwords do not match');
        }
        
        // Validate new password complexity
        const validation = this.validatePassword(newPassword);
        if (!validation.valid) {
            throw new Error(`Password requirements not met: ${validation.errors.join(', ')}`);
        }
        
        // Hash new password
        return await this.hashPassword(newPassword);
    }
}

// Create global auth instance
window.auth = new AuthSystem();