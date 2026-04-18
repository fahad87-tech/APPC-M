/**
 * Template for updating HTML files with enhanced authentication
 * 
 * Steps to update each HTML file:
 * 
 * 1. Add script tag for auth.js:
 *    <script src="../auth.js"></script>
 * 
 * 2. Replace hardcoded hash with PBKDF2 configuration:
 *    const AUTH_CONFIG = {
 *      hash: "generated_hash_here",
 *      salt: "generated_salt_here",
 *      iterations: 100000,
 *      algorithm: "PBKDF2-HMAC-SHA-256"
 *    };
 * 
 * 3. Update verifyWebsiteAccess function to use new auth system:
 *    async function verifyWebsiteAccess() {
 *      const userInput = await requestPassword("Website Access", "Website password required:");
 *      
 *      if (userInput === null) {
 *        window.location.replace("about:blank");
 *        return;
 *      }
 *      
 *      try {
 *        // Check rate limit
 *        auth.checkRateLimit();
 *        
 *        // Verify password
 *        const isValid = await auth.verifyPassword(
 *          userInput,
 *          AUTH_CONFIG.hash,
 *          AUTH_CONFIG.salt,
 *          AUTH_CONFIG.iterations
 *        );
 *        
 *        if (isValid) {
 *          auth.updateRateLimit(true);
 *          auth.createSession("user");
 *          document.documentElement.classList.remove("password-locked");
 *        } else {
 *          auth.updateRateLimit(false);
 *          const rateData = auth.checkRateLimit();
 *          const remainingAttempts = Math.max(0, 5 - rateData.attempts);
 *          alert(`Incorrect password. ${remainingAttempts} attempt(s) remaining.`);
 *          if (rateData.attempts >= 5) {
 *            const lockoutMinutes = Math.ceil((rateData.lockoutUntil - Date.now()) / 60000);
 *            alert(`Account locked. Try again in ${lockoutMinutes} minute(s).`);
 *          }
 *          window.location.replace("about:blank");
 *        }
 *      } catch (error) {
 *        alert(error.message);
 *        window.location.replace("about:blank");
 *      }
 *    }
 * 
 * 4. Add session check on page load:
 *    // Check for existing valid session
 *    if (auth.isAuthenticated()) {
 *      document.documentElement.classList.remove("password-locked");
 *    } else {
 *      verifyWebsiteAccess();
 *    }
 * 
 * 5. Optional: Add session timeout monitoring
 *    setInterval(() => {
 *      if (!auth.isAuthenticated()) {
 *        document.documentElement.classList.add("password-locked");
 *        verifyWebsiteAccess();
 *      }
 *    }, 60000); // Check every minute
 */

// Example of updated index.html authentication section:

/*
<!-- Add this after your existing script tag -->
<script src="../auth.js"></script>

<script>
  // Updated authentication configuration
  const AUTH_CONFIG = {
    hash: "YOUR_GENERATED_HASH_HERE",
    salt: "YOUR_GENERATED_SALT_HERE",
    iterations: 100000,
    algorithm: "PBKDF2-HMAC-SHA-256"
  };

  // Session check
  if (auth.isAuthenticated()) {
    document.documentElement.classList.remove("password-locked");
  } else {
    verifyWebsiteAccess();
  }

  async function verifyWebsiteAccess() {
    const userInput = await requestPassword("Website Access", "Website password required:");
    
    if (userInput === null) {
      window.location.replace("about:blank");
      return;
    }
    
    try {
      // Check rate limit
      auth.checkRateLimit();
      
      // Verify password
      const isValid = await auth.verifyPassword(
        userInput,
        AUTH_CONFIG.hash,
        AUTH_CONFIG.salt,
        AUTH_CONFIG.iterations
      );
      
      if (isValid) {
        auth.updateRateLimit(true);
        auth.createSession("user");
        document.documentElement.classList.remove("password-locked");
      } else {
        auth.updateRateLimit(false);
        const rateData = auth.checkRateLimit();
        const remainingAttempts = Math.max(0, 5 - rateData.attempts);
        alert(`Incorrect password. ${remainingAttempts} attempt(s) remaining.`);
        if (rateData.attempts >= 5) {
          const lockoutMinutes = Math.ceil((rateData.lockoutUntil - Date.now()) / 60000);
          alert(`Account locked. Try again in ${lockoutMinutes} minute(s).`);
        }
        window.location.replace("about:blank");
      }
    } catch (error) {
      alert(error.message);
      window.location.replace("about:blank");
    }
  }

  // Optional: Session timeout monitoring
  setInterval(() => {
    if (!auth.isAuthenticated()) {
      document.documentElement.classList.add("password-locked");
      verifyWebsiteAccess();
    }
  }, 60000);
</script>
*/

// Migration script to update all HTML files
const fs = require('fs');
const path = require('path');

function updateHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find and replace the old hash declaration
  const oldHashRegex = /const\s+(WEBSITE_TARGET_HASH|TARGET_HASH|SIMULATION_TARGET_HASH)\s*=\s*["'][^"']+["'];/;
  
  if (oldHashRegex.test(content)) {
    // Replace with new configuration
    content = content.replace(oldHashRegex, `// Updated authentication configuration
  const AUTH_CONFIG = {
    hash: "YOUR_GENERATED_HASH_HERE",
    salt: "YOUR_GENERATED_SALT_HERE",
    iterations: 100000,
    algorithm: "PBKDF2-HMAC-SHA-256"
  };`);
    
    // Add auth.js script tag if not present
    if (!content.includes('src="../auth.js"') && !content.includes('src="auth.js"')) {
      content = content.replace(/<script>/, '<script src="../auth.js"></script>\n<script>');
    }
    
    // Update the verification logic
    const verifyFunctionRegex = /async function verifyWebsiteAccess\(\)[\s\S]*?window\.location\.replace\("about:blank"\);\s*\}/;
    // This would need more complex replacement based on the specific file structure
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

// Note: For production use, create a proper migration script
// that handles the different file structures and paths