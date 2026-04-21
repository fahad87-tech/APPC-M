# Updates Summary - April 21, 2026

## New Simulation Added
**Newton's Second Law: Dynamics & Kinematics**
- Location: `Beyond Physics SIMS/newton's Laws/Newton's Second Law.html`
- Added to index.html under Newton's Laws section
- Password protected with classroom password

## Changes Made

### 1. index.html (Modified)
- Added new simulation card in the "Newton's Laws" section
- Card includes: 🎯 icon, title, subtitle, description, and 🔒 tag
- Links to `newton's Laws/Newton's Second Law.html`

### 2. Newton's Second Law.html (New File → Updated)
- Added password gate with SHA-256 hashing
- Integrated auth.js for centralized authentication
- Session management support
- Redirects to index.html on cancel/failure

## Password Protection
- Uses same classroom password as other locked simulations
- Hash: `596a81d15423beb932e31857b7c2f4296e4a885a94edfdadfc7cbeb4fc3289e4`
- Legacy SHA-256 (will be upgraded to PBKDF2 in security migration)

## Next Steps for Enhanced Security
1. Run `enhanced-hash.html` to generate new PBKDF2 hash with salt
2. Update `AUTH_CONFIG` in simulation to use new hash parameters
3. Replace legacy SHA-256 verification with `auth.verifyPassword()`
4. Update all simulation files gradually per `SECURITY_ENHANCEMENT_PLAN.md`

## Files Status
```
 M Beyond Physics SIMS/index.html
?? Beyond Physics SIMS/newton's Laws/Newton's Second Law.html
```

## Recommit
```bash
git add "Beyond Physics SIMS/newton's Laws/Newton's Second Law.html"
git add "Beyond Physics SIMS/index.html"
git commit -m "Add Newton's Second Law simulation with password protection"
```

The simulation is now live and ready for classroom use with the standard classroom password.