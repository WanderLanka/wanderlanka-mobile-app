import { router } from 'expo-router';

/**
 * Deep linking utility for handling password reset links
 */
export class DeepLinkingService {
  /**
   * Handle password reset deep link
   * Expected format: wanderlankawebapp://reset-password?email=user@example.com&otp=123456
   */
  static handlePasswordResetLink(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Check if it's a password reset link
      if (urlObj.pathname === '/reset-password') {
        const email = urlObj.searchParams.get('email');
        const otp = urlObj.searchParams.get('otp');
        
        if (email && otp) {
          // Navigate to reset password screen with parameters
          router.push({
            pathname: '/auth/resetPassword',
            params: { email, otp }
          });
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error parsing deep link:', error);
      return false;
    }
  }

  /**
   * Handle general deep links
   */
  static handleDeepLink(url: string): boolean {
    // Try password reset first
    if (this.handlePasswordResetLink(url)) {
      return true;
    }

    // Add other deep link handlers here as needed
    // Example: profile links, booking links, etc.
    
    return false;
  }

  /**
   * Generate password reset deep link
   * This would typically be called by the backend when sending emails
   */
  static generatePasswordResetLink(email: string, otp: string): string {
    return `wanderlankawebapp://reset-password?email=${encodeURIComponent(email)}&otp=${otp}`;
  }
}
