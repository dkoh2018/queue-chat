import { OptimizationRequest, OptimizationResponse } from '@/types';
import { API_ENDPOINTS } from '@/utils';
import { supabase } from '@/lib/supabase';

class OptimizationService {
  /**
   * Get auth headers for API requests
   */
  private getAuthHeaders = async (): Promise<HeadersInit> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Debug logging
    console.log('OptimizationService - Getting auth headers:', { 
      hasSession: !!session, 
      hasAccessToken: !!session?.access_token,
      error: error?.message 
    });
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if user is authenticated
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      console.warn('OptimizationService - No access token found');
    }

    return headers;
  }

  /**
   * Optimize user input using AI
   */
  async optimizeInput(request: OptimizationRequest): Promise<OptimizationResponse> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.OPTIMIZE_INPUT, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Optimization failed' }));
      
      // If unauthorized, it might be a session issue
      if (response.status === 401) {
        console.error('OptimizationService - Unauthorized error, session might be invalid');
        // Force sign out to clear invalid session
        await supabase.auth.signOut();
        window.location.href = '/login';
        throw new Error('Session expired - please sign in again');
      }
      
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // If optimization failed, return original input as fallback
    if (data.error) {
      return {
        originalInput: request.userInput,
        optimizedInput: request.userInput,
        error: data.error,
      };
    }

    return data;
  }
}

// Export singleton instance
export const optimizationService = new OptimizationService();