import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { GoogleOAuth } from "@convex-dev/auth/providers/GoogleOAuth";
import { GitHubOAuth } from "@convex-dev/auth/providers/GitHubOAuth";

/**
 * Convex Auth configuration with multiple providers
 * 
 * Supports:
 * - Email/Password authentication
 * - Google OAuth
 * - GitHub OAuth
 * 
 * To add more providers, import them and add to the providers array
 */
export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    // Email/Password provider with custom configuration
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
      // Optional: Custom password validation
      verify: async (params) => {
        // Add your custom password validation logic here
        // Return true if valid, false if invalid
        return true;
      },
    }),
    
    // Google OAuth provider
    GoogleOAuth({
      // These environment variables should be set in your .env.local file
      // GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
    }),
    
    // GitHub OAuth provider  
    GitHubOAuth({
      // These environment variables should be set in your .env.local file
      // GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET
    }),
  ],
});

/**
 * Custom user profile configuration
 * This defines what user data is stored in your database
 */
export const userProfile = {
  // Required fields
  email: { type: "string", required: true },
  name: { type: "string", required: true },
  
  // Optional fields you can customize
  avatar: { type: "string", required: false },
  role: { type: "string", required: false, default: "user" },
  createdAt: { type: "number", required: false },
  lastLoginAt: { type: "number", required: false },
  isEmailVerified: { type: "boolean", required: false, default: false },
  preferences: { type: "object", required: false },
} as const;