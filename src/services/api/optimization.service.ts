import { OptimizationRequest, OptimizationResponse } from '@/types';
import { API_ENDPOINTS } from '@/utils';

class OptimizationService {
  /**
   * Optimize user input using AI
   */
  async optimizeInput(request: OptimizationRequest): Promise<OptimizationResponse> {
    const response = await fetch(API_ENDPOINTS.OPTIMIZE_INPUT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Optimization failed' }));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // If optimization failed, return original input as fallback
    if (data.error) {
      console.warn('Optimization failed, using original input:', data.error);
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