/**
 * Mobile Debug Utility
 * 
 * Professional debugging solution for mobile styling issues.
 * Provides real-time viewport information and safe area data.
 * Use this instead of pushing to test on device every time.
 */

export interface ViewportInfo {
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  devicePixelRatio: number;
  safeAreaInsets: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  visualViewport?: {
    width: number;
    height: number;
    offsetTop: number;
    offsetLeft: number;
    scale: number;
  };
  orientation: string;
  platform: string;
  userAgent: string;
  isKeyboardVisible: boolean;
  keyboardHeight: number;
}

class MobileDebugger {
  private debugElement: HTMLElement | null = null;
  private isEnabled = false;
  private updateInterval: number | null = null;

  constructor() {
    // Only enable in development
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Initialize the debug overlay
   */
  init() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    this.createDebugElement();
    this.startMonitoring();
    this.addEventListeners();
  }

  /**
   * Destroy the debug overlay
   */
  destroy() {
    if (this.debugElement) {
      this.debugElement.remove();
      this.debugElement = null;
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Get current viewport information
   */
  getViewportInfo(): ViewportInfo {
    const info: ViewportInfo = {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      devicePixelRatio: window.devicePixelRatio,
      safeAreaInsets: {
        top: this.getCSSVar('safe-area-inset-top'),
        right: this.getCSSVar('safe-area-inset-right'),
        bottom: this.getCSSVar('safe-area-inset-bottom'),
        left: this.getCSSVar('safe-area-inset-left'),
      },
      orientation: screen.orientation?.type || 'unknown',
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      isKeyboardVisible: document.body.classList.contains('keyboard-visible'),
      keyboardHeight: parseInt(this.getCSSVar('keyboard-height') || '0'),
    };

    // Add visual viewport info if available
    if ('visualViewport' in window && window.visualViewport) {
      const vv = window.visualViewport as VisualViewport;
      info.visualViewport = {
        width: vv.width,
        height: vv.height,
        offsetTop: vv.offsetTop,
        offsetLeft: vv.offsetLeft,
        scale: vv.scale,
      };
    }

    return info;
  }

  /**
   * Check if device is in mobile viewport
   */
  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  /**
   * Check if device is iOS
   */
  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  /**
   * Check if device is in PWA mode
   */
  isPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           !!(window.navigator as unknown as { standalone?: boolean }).standalone;
  }

  /**
   * Get element positioning relative to safe areas
   */
  getElementSafeAreaInfo(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const safeAreaBottom = parseInt(this.getCSSVar('safe-area-inset-bottom') || '0');
    const keyboardHeight = parseInt(this.getCSSVar('keyboard-height') || '0');
    
    return {
      element: {
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        distanceFromBottom: window.innerHeight - rect.bottom,
      },
      safeArea: {
        bottom: safeAreaBottom,
        actualBottom: Math.max(safeAreaBottom, keyboardHeight),
      },
      visibility: {
        isVisible: rect.bottom <= window.innerHeight - safeAreaBottom,
        hiddenBy: rect.bottom - (window.innerHeight - safeAreaBottom),
      }
    };
  }

  private createDebugElement() {
    this.debugElement = document.createElement('div');
    this.debugElement.id = 'mobile-debug-overlay';
    this.debugElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 10px;
      padding: 8px;
      border-radius: 4px;
      z-index: 99999;
      max-width: 200px;
      min-width: 150px;
      border: 1px solid #333;
      backdrop-filter: blur(10px);
      pointer-events: none;
      user-select: none;
      line-height: 1.2;
    `;
    document.body.appendChild(this.debugElement);
  }

  private startMonitoring() {
    this.updateDebugInfo();
    this.updateInterval = window.setInterval(() => {
      this.updateDebugInfo();
    }, 1000);
  }

  private updateDebugInfo() {
    if (!this.debugElement) return;

    const info = this.getViewportInfo();
    const disclaimer = document.querySelector('[class*="disclaimer"]');
    
    let elementInfo = '';
    if (disclaimer) {
      const safeInfo = this.getElementSafeAreaInfo(disclaimer as HTMLElement);
      elementInfo = `
📍 Disclaimer Position:
  Bottom: ${safeInfo.element.distanceFromBottom}px
  Hidden: ${safeInfo.visibility.hiddenBy > 0 ? safeInfo.visibility.hiddenBy + 'px' : 'No'}
  Visible: ${safeInfo.visibility.isVisible ? 'Yes' : 'No'}
`;
    }

    this.debugElement.innerHTML = `
📱 Viewport: ${info.innerWidth}×${info.innerHeight}
🔍 DPR: ${info.devicePixelRatio}
🔄 Orientation: ${info.orientation}
📲 PWA: ${this.isPWA() ? 'Yes' : 'No'}
🍎 iOS: ${this.isIOS() ? 'Yes' : 'No'}

🛡️ Safe Areas:
  T: ${info.safeAreaInsets.top}
  R: ${info.safeAreaInsets.right}
  B: ${info.safeAreaInsets.bottom}
  L: ${info.safeAreaInsets.left}

⌨️ Keyboard:
  Visible: ${info.isKeyboardVisible ? 'Yes' : 'No'}
  Height: ${info.keyboardHeight}px

${info.visualViewport ? `
👁️ Visual Viewport:
  Size: ${info.visualViewport.width}×${info.visualViewport.height}
  Offset: ${info.visualViewport.offsetTop}px
  Scale: ${info.visualViewport.scale}
` : ''}

${elementInfo}
`.trim();
  }

  private addEventListeners() {
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.updateDebugInfo(), 500);
    });

    // Listen for resize events
    window.addEventListener('resize', () => {
      this.updateDebugInfo();
    });

    // Listen for keyboard events
    document.body.addEventListener('classchange', () => {
      this.updateDebugInfo();
    });

    // Listen for visual viewport changes
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', () => {
        this.updateDebugInfo();
      });
    }
  }

  private getCSSVar(name: string): string {
    const value = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`) ||
                  getComputedStyle(document.documentElement).getPropertyValue(`env(${name})`);
    return value.trim();
  }
}

// Export singleton instance
export const mobileDebugger = new MobileDebugger();

// Auto-initialize in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.addEventListener('DOMContentLoaded', () => {
    mobileDebugger.init();
  });
}

// Add to window for manual debugging
if (typeof window !== 'undefined') {
  (window as any).mobileDebugger = mobileDebugger;
}
