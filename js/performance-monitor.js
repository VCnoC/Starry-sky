/**
 * PerformanceMonitor class for tracking and displaying performance metrics
 * Handles FPS calculation, memory usage, and other performance indicators
 */
class PerformanceMonitor {
    /**
     * Create a new performance monitor
     */
    constructor() {
        // Performance tracking
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsUpdate = 0;
        this.fpsHistory = [];
        this.maxFpsHistory = 60; // Keep last 60 FPS readings
        
        // Memory tracking (if available)
        this.memoryInfo = null;
        
        // Timing
        this.lastFrameTime = 0;
        this.frameTime = 0;
        this.averageFrameTime = 16.67; // Target 60fps = 16.67ms per frame
        
        // Performance thresholds
        this.lowFpsThreshold = 30;
        this.highFrameTimeThreshold = 33.33; // 30fps = 33.33ms per frame
        
        // Callbacks for performance events
        this.onLowPerformance = null;
        this.onGoodPerformance = null;
    }
    
    /**
     * Update performance metrics with current frame data
     * @param {number} currentTime - Current timestamp from requestAnimationFrame
     */
    update(currentTime) {
        // Calculate frame time
        if (this.lastFrameTime > 0) {
            this.frameTime = currentTime - this.lastFrameTime;
        }
        this.lastFrameTime = currentTime;
        
        // Update FPS counter
        this.frameCount++;
        
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
            
            // Add to FPS history
            this.fpsHistory.push(this.fps);
            if (this.fpsHistory.length > this.maxFpsHistory) {
                this.fpsHistory.shift();
            }
            
            // Check performance thresholds
            this.checkPerformanceThresholds();
        }
        
        // Update memory info if available
        this.updateMemoryInfo();
    }
    
    /**
     * Check performance thresholds and trigger callbacks
     */
    checkPerformanceThresholds() {
        const avgFps = this.getAverageFPS();
        
        if (avgFps < this.lowFpsThreshold) {
            if (this.onLowPerformance) {
                this.onLowPerformance({
                    fps: avgFps,
                    frameTime: this.frameTime,
                    type: 'low_fps'
                });
            }
        } else if (avgFps > this.lowFpsThreshold + 10) {
            if (this.onGoodPerformance) {
                this.onGoodPerformance({
                    fps: avgFps,
                    frameTime: this.frameTime,
                    type: 'good_fps'
                });
            }
        }
    }
    
    /**
     * Update memory information if available
     */
    updateMemoryInfo() {
        if (performance.memory) {
            this.memoryInfo = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
    }
    
    /**
     * Get current FPS
     * @returns {number} Current frames per second
     */
    getFPS() {
        return this.fps;
    }
    
    /**
     * Get average FPS over recent history
     * @returns {number} Average FPS
     */
    getAverageFPS() {
        if (this.fpsHistory.length === 0) {
            return this.fps;
        }
        
        const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.fpsHistory.length);
    }
    
    /**
     * Get current frame time in milliseconds
     * @returns {number} Frame time in ms
     */
    getFrameTime() {
        return this.frameTime;
    }
    
    /**
     * Get memory usage information
     * @returns {Object|null} Memory info or null if not available
     */
    getMemoryInfo() {
        return this.memoryInfo;
    }
    
    /**
     * Get performance statistics
     * @returns {Object} Performance statistics
     */
    getStats() {
        return {
            fps: this.fps,
            averageFps: this.getAverageFPS(),
            frameTime: this.frameTime,
            memoryInfo: this.memoryInfo,
            fpsHistory: [...this.fpsHistory],
            isLowPerformance: this.getAverageFPS() < this.lowFpsThreshold
        };
    }
    
    /**
     * Set callback for low performance events
     * @param {Function} callback - Callback function
     */
    setLowPerformanceCallback(callback) {
        this.onLowPerformance = callback;
    }
    
    /**
     * Set callback for good performance events
     * @param {Function} callback - Callback function
     */
    setGoodPerformanceCallback(callback) {
        this.onGoodPerformance = callback;
    }
    
    /**
     * Set FPS threshold for low performance detection
     * @param {number} threshold - FPS threshold
     */
    setLowFpsThreshold(threshold) {
        this.lowFpsThreshold = Math.max(1, Math.min(60, threshold));
    }
    
    /**
     * Reset performance tracking
     */
    reset() {
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsUpdate = 0;
        this.fpsHistory = [];
        this.lastFrameTime = 0;
        this.frameTime = 0;
    }
    
    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            ...this.getStats(),
            thresholds: {
                lowFps: this.lowFpsThreshold,
                highFrameTime: this.highFrameTimeThreshold
            },
            callbacks: {
                hasLowPerformanceCallback: this.onLowPerformance !== null,
                hasGoodPerformanceCallback: this.onGoodPerformance !== null
            }
        };
    }
}

// Export for use in other modules (if using modules) or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
} else {
    window.PerformanceMonitor = PerformanceMonitor;
}