/**
 * Network Diagnostics Utility
 * Helps debug server connection issues
 */

import { API_CONFIG } from '../services/config';

export class NetworkDiagnostics {
  /**
   * Test connectivity to various endpoints
   */
  static async runDiagnostics(): Promise<{
    baseUrl: string;
    gateway: { reachable: boolean; response?: any };
    userService: { reachable: boolean; response?: any };
    errors: string[];
  }> {
    const errors: string[] = [];
    const baseUrl = API_CONFIG.BASE_URL;
    
    console.log('🔬 Running network diagnostics...');
    console.log('📡 Current BASE_URL:', baseUrl);
    
    // Test API Gateway health
    let gateway = { reachable: false, response: undefined };
    try {
      const gatewayUrl = `${baseUrl}/health`;
      console.log('🔍 Testing API Gateway:', gatewayUrl);
      
      const response = await fetch(gatewayUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        gateway = { reachable: true, response: data };
        console.log('✅ API Gateway is reachable:', data);
      } else {
        errors.push(`API Gateway returned status ${response.status}`);
        console.error('❌ API Gateway error:', response.status);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      errors.push(`API Gateway unreachable: ${errMsg}`);
      console.error('❌ API Gateway error:', error);
    }
    
    // Test User Service directly (if gateway is down)
    let userService = { reachable: false, response: undefined };
    try {
      // Try direct user service on port 3001
      const userServiceUrl = baseUrl.replace(':3000', ':3001') + '/health';
      console.log('🔍 Testing User Service directly:', userServiceUrl);
      
      const response = await fetch(userServiceUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        userService = { reachable: true, response: data };
        console.log('✅ User Service is reachable:', data);
      } else {
        errors.push(`User Service returned status ${response.status}`);
        console.error('❌ User Service error:', response.status);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      errors.push(`User Service unreachable: ${errMsg}`);
      console.error('❌ User Service error:', error);
    }
    
    // Test registration endpoint
    try {
      const registerUrl = `${baseUrl}${API_CONFIG.ENDPOINTS.AUTH}/register`;
      console.log('🔍 Testing registration endpoint (OPTIONS):', registerUrl);
      
      const response = await fetch(registerUrl, {
        method: 'OPTIONS',
        headers: { 'Accept': 'application/json' },
      });
      
      console.log('📡 Registration endpoint OPTIONS response:', response.status);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Registration endpoint check failed: ${errMsg}`);
      console.error('❌ Registration endpoint error:', error);
    }
    
    const summary = {
      baseUrl,
      gateway,
      userService,
      errors,
    };
    
    console.log('🔬 Diagnostics complete:', summary);
    return summary;
  }
  
  /**
   * Get a user-friendly diagnostic report
   */
  static async getDiagnosticReport(): Promise<string> {
    const results = await this.runDiagnostics();
    
    let report = '📊 Network Diagnostics Report\n\n';
    report += `Current Server: ${results.baseUrl}\n\n`;
    
    if (results.gateway.reachable) {
      report += '✅ API Gateway: Connected\n';
    } else {
      report += '❌ API Gateway: Not reachable\n';
    }
    
    if (results.userService.reachable) {
      report += '✅ User Service: Connected\n';
    } else {
      report += '❌ User Service: Not reachable\n';
    }
    
    if (results.errors.length > 0) {
      report += '\nErrors:\n';
      results.errors.forEach(error => {
        report += `  • ${error}\n`;
      });
    }
    
    return report;
  }
}
