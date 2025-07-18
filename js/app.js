/**
 * Main application entry point for 3D Star Field
 * Initializes and coordinates all components
 */
class StarFieldApp {
    constructor() {
        // Core components
        this.canvas = null;
        this.starField = null;
        this.inputHandler = null;
        this.configPanel = null;
        this.performanceMonitor = null;
        
        // Application state
        this.isInitialized = false;
        this.isRunning = false;
        
        // Bind methods
        this.handleResize = this.handleResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }
    
    /**
     * Initialize the application
     */
    initialize() {
        try {
            // Check browser compatibility first
            if (!this.checkBrowserCompatibility()) {
                return;
            }
            
            // Detect mobile device early
            this.isMobile = this.detectMobileDevice();
            
            // Get canvas element
            this.canvas = document.getElementById('starfield-canvas');
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }
            
            // Check canvas support
            if (!this.canvas.getContext) {
                throw new Error('Canvas not supported by this browser');
            }
            
            const ctx = this.canvas.getContext('2d');
            if (!ctx) {
                throw new Error('2D canvas context not available');
            }
            
            // Set initial canvas size
            this.resizeCanvas();
            
            // Initialize star field with mobile-optimized star count
            const initialStarCount = this.isMobile ? 500 : 1000;
            this.starField = new StarField(this.canvas, initialStarCount);
            
            // Get performance monitor from star field
            this.performanceMonitor = this.starField.getPerformanceMonitor();
            
            // Initialize input handler with rotation callback and mobile options
            const inputOptions = this.isMobile ? {
                touchSensitivity: 0.002,
                smoothing: 0.15 // Slightly more smoothing for mobile
            } : {};
            
            this.inputHandler = new InputHandler(
                this.canvas,
                (rotX, rotY) => {
                    if (this.starField) {
                        this.starField.setRotation(rotX, rotY);
                    }
                },
                inputOptions
            );
            
            // Initialize configuration panel
            this.configPanel = new ConfigPanel(this.starField, this.inputHandler);
            
            // Apply mobile optimizations
            if (this.isMobile) {
                this.optimizeForMobile();
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start the application
            this.start();
            
            this.isInitialized = true;
            console.log('3D Star Field application initialized successfully', 
                       this.isMobile ? '(Mobile optimized)' : '(Desktop)');
            
        } catch (error) {
            console.error('Failed to initialize 3D Star Field application:', error);
            this.showError('Failed to initialize application: ' + error.message);
        }
    }
    
    /**
     * Check browser compatibility and show fallback if needed
     * @returns {boolean} True if browser is compatible
     */
    checkBrowserCompatibility() {
        const requiredFeatures = {
            canvas: 'HTML5 Canvas',
            requestAnimationFrame: 'Animation Frame API',
            performance: 'Performance API'
        };
        
        const missingFeatures = [];
        
        // Check for canvas support
        if (!document.createElement('canvas').getContext) {
            missingFeatures.push(requiredFeatures.canvas);
        }
        
        // Check for requestAnimationFrame
        if (!window.requestAnimationFrame) {
            missingFeatures.push(requiredFeatures.requestAnimationFrame);
        }
        
        // Check for performance.now
        if (!window.performance || !window.performance.now) {
            missingFeatures.push(requiredFeatures.performance);
        }
        
        // If any features are missing, show fallback
        if (missingFeatures.length > 0) {
            this.showBrowserFallback(missingFeatures);
            return false;
        }
        
        return true;
    }
    
    /**
     * Show browser compatibility fallback message
     * @param {Array} missingFeatures - List of missing browser features
     */
    showBrowserFallback(missingFeatures) {
        const fallbackHtml = `
            <div class="browser-fallback">
                <h2>Browser Not Supported</h2>
                <p>Your browser doesn't support the following required features:</p>
                <ul>
                    ${missingFeatures.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
                <p>Please upgrade to a modern browser to experience the 3D Star Field:</p>
                <ul>
                    <li>Chrome 60+</li>
                    <li>Firefox 55+</li>
                    <li>Safari 12+</li>
                    <li>Edge 79+</li>
                </ul>
                <div class="fallback-image">
                    <div class="static-stars">
                        ${this.generateStaticStars()}
                    </div>
                    <p><em>Static star field preview</em></p>
                </div>
            </div>
        `;
        
        // Replace the main app content with fallback
        const appElement = document.getElementById('app');
        if (appElement) {
            appElement.innerHTML = fallbackHtml;
        }
        
        console.warn('Browser compatibility check failed. Showing fallback content.');
    }
    
    /**
     * Generate static stars for fallback display
     * @returns {string} HTML for static stars
     */
    generateStaticStars() {
        let starsHtml = '';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const size = Math.random() * 3 + 1;
            const opacity = Math.random() * 0.8 + 0.2;
            
            starsHtml += `<div class="static-star" style="
                left: ${x}%;
                top: ${y}%;
                width: ${size}px;
                height: ${size}px;
                opacity: ${opacity};
            "></div>`;
        }
        return starsHtml;
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', this.handleResize);
        
        // Orientation change (mobile devices)
        if (this.isMobile) {
            window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
        }
        
        // Page visibility change (pause when tab is hidden)
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Performance monitoring callbacks
        if (this.performanceMonitor) {
            this.performanceMonitor.setLowPerformanceCallback((data) => {
                console.warn('Low performance detected:', data);
                this.handleLowPerformance(data);
            });
        }
        
        // Error handling
        window.addEventListener('error', (event) => {
            console.error('Application error:', event.error);
        });
        
        // Unload cleanup
        window.addEventListener('beforeunload', () => {
            this.destroy();
        });
    }
    
    /**
     * Start the application
     */
    start() {
        if (!this.isInitialized || this.isRunning) {
            return;
        }
        
        try {
            // Start star field animation
            this.starField.start();
            
            // Start main update loop
            this.isRunning = true;
            this.update();
            
            console.log('3D Star Field application started');
            
        } catch (error) {
            console.error('Failed to start application:', error);
            this.showError('Failed to start application: ' + error.message);
        }
    }
    
    /**
     * Stop the application
     */
    stop() {
        if (!this.isRunning) {
            return;
        }
        
        this.isRunning = false;
        
        if (this.starField) {
            this.starField.stop();
        }
        
        console.log('3D Star Field application stopped');
    }
    
    /**
     * Main update loop
     */
    update() {
        if (!this.isRunning) {
            return;
        }
        
        const currentTime = performance.now();
        
        // Update performance monitor
        if (this.performanceMonitor) {
            this.performanceMonitor.update(currentTime);
        }
        
        // Continue update loop
        requestAnimationFrame(() => this.update());
    }
    
    /**
     * Handle window resize with mobile optimization
     */
    handleResize() {
        if (!this.canvas || !this.starField) {
            return;
        }
        
        // Debounce resize events (longer delay for mobile)
        const debounceDelay = this.isMobileDevice() ? 200 : 100;
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.resizeCanvas();
            this.starField.resize(this.canvas.width, this.canvas.height);
            
            // Adjust performance for new screen size on mobile
            if (this.isMobileDevice()) {
                this.optimizeForMobile();
            }
        }, debounceDelay);
    }
    
    /**
     * Handle page visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, pause animation to save resources
            this.stop();
        } else {
            // Page is visible, resume animation
            if (this.isInitialized) {
                this.start();
            }
        }
    }
    
    /**
     * Handle orientation change on mobile devices
     */
    handleOrientationChange() {
        if (!this.isMobile) {
            return;
        }
        
        // Delay handling to allow browser to update dimensions
        setTimeout(() => {
            console.log('Orientation changed, reoptimizing for mobile');
            
            // Force canvas resize
            this.resizeCanvas();
            
            // Reapply mobile optimizations for new orientation
            this.optimizeForMobile();
            
            // Notify star field of resize
            if (this.starField) {
                this.starField.resize(this.canvas.width, this.canvas.height);
            }
        }, 300); // Wait for orientation change to complete
    }
    
    /**
     * Handle low performance situations
     * @param {Object} data - Performance data
     */
    handleLowPerformance(data) {
        if (!this.starField) {
            return;
        }
        
        const currentStarCount = this.starField.getStarCount();
        
        // Reduce star count by 25% when performance is low
        const newStarCount = Math.max(100, Math.floor(currentStarCount * 0.75));
        
        if (newStarCount < currentStarCount) {
            this.starField.setStarCount(newStarCount);
            console.log(`Performance optimization: Reduced star count from ${currentStarCount} to ${newStarCount}`);
            
            // Show user notification about performance adjustment
            this.showPerformanceNotification(newStarCount);
        }
        
        // Additional mobile-specific optimizations
        if (this.isMobile && this.starField.renderer) {
            this.starField.renderer.updateConfig({
                enableGlow: false, // Disable glow effects
                batchRendering: true,
                maxBatchSize: 25, // Smaller batches
                trailLength: 0.5 // Longer trails to compensate
            });
        }
    }
    
    /**
     * Show performance adjustment notification to user
     * @param {number} newStarCount - New star count after optimization
     */
    showPerformanceNotification(newStarCount) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'performance-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <strong>Performance Optimized</strong><br>
                Star count reduced to ${newStarCount} for better performance
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 1000;
            font-size: 14px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideDown 0.3s ease-out;
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideUp 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);
    }
    
    /**
     * Detect if device is mobile
     * @returns {boolean} True if mobile device detected
     */
    detectMobileDevice() {
        // Check user agent for mobile indicators
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = [
            'mobile', 'android', 'iphone', 'ipad', 'ipod', 
            'blackberry', 'windows phone', 'opera mini'
        ];
        
        const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        // Check screen size (mobile-like dimensions)
        const isMobileScreen = window.innerWidth <= 768 || window.innerHeight <= 768;
        
        // Check for touch capability
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Check device pixel ratio (many mobile devices have high DPR)
        const hasHighDPR = window.devicePixelRatio > 1.5;
        
        // Combine checks for better detection
        return isMobileUA || (isMobileScreen && hasTouch) || (hasTouch && hasHighDPR && isMobileScreen);
    }
    
    /**
     * Check if current device is mobile
     * @returns {boolean} True if mobile device
     */
    isMobileDevice() {
        return this.isMobile || false;
    }
    
    /**
     * Optimize application for mobile devices
     */
    optimizeForMobile() {
        if (!this.isMobile || !this.starField) {
            return;
        }
        
        // Get current screen dimensions
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const screenArea = screenWidth * screenHeight;
        
        // Calculate optimal star count based on screen size and device capabilities
        let optimalStarCount;
        
        if (screenArea < 300000) { // Small screens (< ~550x550)
            optimalStarCount = 200;
        } else if (screenArea < 600000) { // Medium screens (< ~775x775)
            optimalStarCount = 350;
        } else { // Larger mobile screens
            optimalStarCount = 500;
        }
        
        // Further reduce for low-end devices (detected by low device pixel ratio)
        const dpr = window.devicePixelRatio || 1;
        if (dpr < 1.5) {
            optimalStarCount = Math.floor(optimalStarCount * 0.7);
        }
        
        // Apply star count optimization
        const currentStarCount = this.starField.getStarCount();
        if (currentStarCount > optimalStarCount) {
            this.starField.setStarCount(optimalStarCount);
            console.log(`Mobile optimization: Reduced star count from ${currentStarCount} to ${optimalStarCount}`);
        }
        
        // Optimize renderer settings for mobile
        if (this.starField.renderer) {
            this.starField.renderer.updateConfig({
                enableGlow: screenArea > 400000, // Disable glow on very small screens
                batchRendering: true, // Always use batch rendering on mobile
                maxBatchSize: 50, // Smaller batches for mobile
                trailLength: 0.4 // Slightly longer trails to compensate for lower frame rates
            });
        }
        
        // Adjust performance monitoring thresholds for mobile
        if (this.performanceMonitor) {
            this.performanceMonitor.setTargetFPS(30); // Lower target FPS for mobile
            this.performanceMonitor.setLowPerformanceThreshold(20); // More aggressive optimization
        }
        
        // Optimize input handling for mobile
        if (this.inputHandler && this.inputHandler.isTouchDevice()) {
            this.inputHandler.setTouchSensitivity(0.0015); // Slightly lower sensitivity
            this.inputHandler.setSmoothing(0.2); // More smoothing for touch
        }
        
        console.log('Mobile optimizations applied');
    }
    
    /**
     * Resize canvas to match window size with mobile optimizations
     */
    resizeCanvas() {
        if (!this.canvas) {
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        let dpr = window.devicePixelRatio || 1;
        
        // Limit device pixel ratio on mobile to save memory and improve performance
        if (this.isMobile && dpr > 2) {
            dpr = 2; // Cap at 2x for mobile devices
        }
        
        // Set canvas size accounting for device pixel ratio
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Scale canvas back down using CSS
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Scale the drawing context to match device pixel ratio
        const ctx = this.canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        
        // Log canvas size for debugging
        if (this.isMobile) {
            console.log(`Canvas resized for mobile: ${rect.width}x${rect.height} (DPR: ${dpr})`);
        }
    }
    
    /**
     * Show error message to user
     * @param {string} message - Error message to display
     */
    showError(message) {
        // Remove any existing error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Add to page
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 10000);
    }
    
    /**
     * Get application status
     * @returns {Object} Application status information
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isRunning: this.isRunning,
            components: {
                canvas: this.canvas !== null,
                starField: this.starField !== null,
                inputHandler: this.inputHandler !== null,
                configPanel: this.configPanel !== null,
                performanceMonitor: this.performanceMonitor !== null
            },
            performance: this.performanceMonitor ? this.performanceMonitor.getStats() : null
        };
    }
    
    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        const status = this.getStatus();
        
        return {
            ...status,
            starField: this.starField ? this.starField.getDebugInfo() : null,
            inputHandler: this.inputHandler ? this.inputHandler.getConfig() : null,
            configPanel: this.configPanel ? this.configPanel.getDebugInfo() : null,
            performanceMonitor: this.performanceMonitor ? this.performanceMonitor.getDebugInfo() : null,
            canvas: this.canvas ? {
                width: this.canvas.width,
                height: this.canvas.height,
                devicePixelRatio: window.devicePixelRatio || 1
            } : null
        };
    }
    
    /**
     * Clean up and destroy the application
     */
    destroy() {
        // Stop the application
        this.stop();
        
        // Clean up components
        if (this.configPanel) {
            this.configPanel.destroy();
            this.configPanel = null;
        }
        
        if (this.inputHandler) {
            this.inputHandler.destroy();
            this.inputHandler = null;
        }
        
        if (this.starField) {
            this.starField.destroy();
            this.starField = null;
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Clear references
        this.canvas = null;
        this.performanceMonitor = null;
        this.isInitialized = false;
        
        console.log('3D Star Field application destroyed');
    }
}

// Initialize the application
let app;

// Make app globally available for debugging
window.starFieldApp = null;

// Start the application
try {
    app = new StarFieldApp();
    window.starFieldApp = app;
} catch (error) {
    console.error('Failed to create 3D Star Field application:', error);
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StarFieldApp;
}