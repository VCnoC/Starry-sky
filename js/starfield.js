

/**
 * StarField class for managing collection of stars and animation loop
 * Handles star initialization, updates, and rendering coordination
 */
class StarField {
    /**
     * Create a new StarField with specified parameters
     * @param {HTMLCanvasElement} canvas - Canvas element for rendering
     * @param {number} starCount - Initial number of stars (default: 1000)
     */
    constructor(canvas, starCount = 1000) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Star management
        this.stars = [];
        this.starCount = starCount;
        this.originalStarCount = starCount; // Store original for performance recovery
        
        // Animation properties
        this.speed = 1.0;
        this.isRunning = false;
        this.animationId = null;
        this.lastTime = 0;
        
        // Camera for 3D projection
        this.camera = new Camera(75, canvas.width / canvas.height, 0.1, 1000);
        this.camera.updateAspectRatio(canvas.width, canvas.height);
        
        // Renderer for visual effects
        this.renderer = new Renderer(canvas);
        
        // Performance monitoring
        this.performanceMonitor = new PerformanceMonitor();
        this.setupPerformanceCallbacks();
        
        // Legacy FPS tracking (for compatibility)
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsUpdate = 0;
        
        // Performance optimization state
        this.performanceOptimizations = {
            autoOptimize: true,
            minStarCount: 100,
            reductionStep: 0.25, // Reduce by 25% each time
            recoveryDelay: 5000, // Wait 5 seconds before trying to recover
            lastOptimization: 0,
            lastRecovery: 0
        };
        
        // Rendering optimizations
        this.renderingOptimizations = {
            frustumCulling: true,
            batchRendering: true,
            maxBatchSize: 100,
            skipFrames: 0, // Skip frames when performance is poor
            frameSkipCounter: 0
        };
        
        // Memory management
        this.memoryManagement = {
            gcInterval: 30000, // Force GC every 30 seconds
            lastGC: 0,
            maxMemoryUsage: 100 * 1024 * 1024, // 100MB threshold
            memoryCheckInterval: 5000,
            lastMemoryCheck: 0
        };
        
        // Initialize stars
        this.initialize();
    }
    
    /**
     * Initialize star collection with random 3D positions
     */
    initialize() {
        this.stars = [];
        
        for (let i = 0; i < this.starCount; i++) {
            // Create star with random position
            const star = this.createRandomStar();
            this.stars.push(star);
        }
    }
    
    /**
     * Create a single star with random 3D position
     * @returns {Star} New star instance
     */
    createRandomStar() {
        const range = 500; // Range for x and y coordinates
        const x = (Math.random() - 0.5) * range * 2;
        const y = (Math.random() - 0.5) * range * 2;
        const z = Math.random() * 1000; // Random depth from 0 to 1000
        
        return new Star(x, y, z);
    }
    
    /**
     * Set up performance monitoring callbacks
     */
    setupPerformanceCallbacks() {
        this.performanceMonitor.setLowPerformanceCallback((data) => {
            if (this.performanceOptimizations.autoOptimize) {
                this.handleLowPerformance(data);
            }
        });
        
        this.performanceMonitor.setGoodPerformanceCallback((data) => {
            if (this.performanceOptimizations.autoOptimize) {
                this.handleGoodPerformance(data);
            }
        });
    }
    
    /**
     * Handle low performance by reducing star count and visual effects
     * @param {Object} data - Performance data
     */
    handleLowPerformance(data) {
        const now = performance.now();
        
        // Don't optimize too frequently
        if (now - this.performanceOptimizations.lastOptimization < 2000) {
            return;
        }
        
        console.warn('Low performance detected, optimizing...', data);
        
        // Reduce star count
        const currentCount = this.getStarCount();
        const minCount = this.performanceOptimizations.minStarCount;
        
        if (currentCount > minCount) {
            const reductionAmount = Math.max(
                Math.floor(currentCount * this.performanceOptimizations.reductionStep),
                1
            );
            const newCount = Math.max(minCount, currentCount - reductionAmount);
            
            this.setStarCount(newCount);
            console.log(`Reduced star count from ${currentCount} to ${newCount}`);
        }
        
        // Reduce visual effects
        if (data.fps < 20) {
            this.renderer.setGlowEnabled(false);
            this.renderer.setTrailsEnabled(false);
            this.renderingOptimizations.skipFrames = 1; // Skip every other frame
            console.log('Disabled visual effects for better performance');
        }
        
        this.performanceOptimizations.lastOptimization = now;
    }
    
    /**
     * Handle good performance by potentially recovering star count
     * @param {Object} data - Performance data
     */
    handleGoodPerformance(data) {
        const now = performance.now();
        
        // Don't recover too frequently
        if (now - this.performanceOptimizations.lastRecovery < this.performanceOptimizations.recoveryDelay) {
            return;
        }
        
        const currentCount = this.getStarCount();
        const originalCount = this.originalStarCount;
        
        // Only recover if we're below original count and performance is good
        if (currentCount < originalCount && data.fps > 50) {
            const recoveryAmount = Math.min(
                Math.floor(originalCount * 0.1), // Recover 10% at a time
                originalCount - currentCount
            );
            
            if (recoveryAmount > 0) {
                const newCount = currentCount + recoveryAmount;
                this.setStarCount(newCount);
                console.log(`Recovered star count from ${currentCount} to ${newCount}`);
            }
            
            // Re-enable visual effects if they were disabled
            if (!this.renderer.getConfig().enableGlow) {
                this.renderer.setGlowEnabled(true);
                this.renderer.setTrailsEnabled(true);
                this.renderingOptimizations.skipFrames = 0;
                console.log('Re-enabled visual effects');
            }
        }
        
        this.performanceOptimizations.lastRecovery = now;
    }
    
    /**
     * Update all stars and handle animation frame
     * @param {number} currentTime - Current timestamp from requestAnimationFrame
     */
    update(currentTime = 0) {
        // Calculate delta time in seconds
        const deltaTime = this.lastTime ? (currentTime - this.lastTime) / 1000 : 0.016;
        this.lastTime = currentTime;
        
        // Update performance monitor
        this.performanceMonitor.update(currentTime);
        
        // Handle memory management
        this.handleMemoryManagement(currentTime);
        
        // Check if we should skip this frame for performance
        if (this.shouldSkipFrame()) {
            return;
        }
        
        // Update all stars
        for (let i = 0; i < this.stars.length; i++) {
            this.stars[i].update(this.speed, deltaTime);
        }
    }
    
    /**
     * Handle memory management and garbage collection
     * @param {number} currentTime - Current timestamp
     */
    handleMemoryManagement(currentTime) {
        const memMgmt = this.memoryManagement;
        
        // Check memory usage periodically
        if (currentTime - memMgmt.lastMemoryCheck > memMgmt.memoryCheckInterval) {
            const memInfo = this.performanceMonitor.getMemoryInfo();
            
            if (memInfo && memInfo.used > memMgmt.maxMemoryUsage) {
                console.warn('High memory usage detected:', memInfo);
                
                // Force garbage collection if available
                if (window.gc) {
                    window.gc();
                    console.log('Forced garbage collection');
                }
                
                // Reset some stars to free up memory
                this.resetStars();
            }
            
            memMgmt.lastMemoryCheck = currentTime;
        }
        
        // Periodic garbage collection hint
        if (currentTime - memMgmt.lastGC > memMgmt.gcInterval) {
            if (window.gc) {
                window.gc();
            }
            memMgmt.lastGC = currentTime;
        }
    }
    
    /**
     * Check if current frame should be skipped for performance
     * @returns {boolean} True if frame should be skipped
     */
    shouldSkipFrame() {
        if (this.renderingOptimizations.skipFrames <= 0) {
            return false;
        }
        
        this.renderingOptimizations.frameSkipCounter++;
        
        if (this.renderingOptimizations.frameSkipCounter > this.renderingOptimizations.skipFrames) {
            this.renderingOptimizations.frameSkipCounter = 0;
            return false;
        }
        
        return true;
    }
    
    /**
     * Update FPS counter
     * @param {number} currentTime - Current timestamp
     */
    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }
    
    /**
     * Start the animation loop
     */
    start() {
        if (this.isRunning) {
            return;
        }
        
        this.isRunning = true;
        this.lastTime = 0;
        this.animate();
    }
    
    /**
     * Stop the animation loop
     */
    stop() {
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Main animation loop using requestAnimationFrame
     * @param {number} currentTime - Current timestamp from requestAnimationFrame
     */
    animate(currentTime = 0) {
        if (!this.isRunning) {
            return;
        }
        
        // Update star positions
        this.update(currentTime);
        
        // Render the star field
        this.render(currentTime);
        
        // Continue animation loop
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }
    
    /**
     * Render the star field using the renderer
     * @param {number} currentTime - Current timestamp for animations
     */
    render(currentTime = 0) {
        const visibleStars = this.getVisibleStars();
        this.renderer.render(visibleStars, currentTime);
    }
    
    /**
     * Set the number of stars in the field
     * @param {number} count - New star count (minimum: 1, maximum: 5000)
     */
    setStarCount(count) {
        // Clamp count to reasonable bounds
        const newCount = Math.max(1, Math.min(5000, Math.floor(count)));
        
        if (newCount === this.starCount) {
            return;
        }
        
        const oldCount = this.starCount;
        this.starCount = newCount;
        
        if (newCount > oldCount) {
            // Add new stars
            for (let i = oldCount; i < newCount; i++) {
                this.stars.push(this.createRandomStar());
            }
        } else {
            // Remove excess stars
            this.stars.splice(newCount);
        }
    }
    
    /**
     * Set animation speed
     * @param {number} speed - New speed multiplier (0.1 to 5.0)
     */
    setSpeed(speed) {
        this.speed = Math.max(0.1, Math.min(5.0, speed));
    }
    
    /**
     * Set camera rotation
     * @param {number} rotX - X-axis rotation in radians
     * @param {number} rotY - Y-axis rotation in radians
     */
    setRotation(rotX, rotY) {
        this.camera.setRotation(rotX, rotY);
    }
    
    /**
     * Update canvas size and camera aspect ratio
     * @param {number} width - New canvas width
     * @param {number} height - New canvas height
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.camera.updateAspectRatio(width, height);
        this.renderer.resize(width, height);
    }
    
    /**
     * Get all stars with their screen positions using optimized frustum culling
     * @returns {Array} Array of objects with star and screen position data
     */
    getVisibleStars() {
        const visibleStars = [];
        const frustumCulling = this.renderingOptimizations.frustumCulling;
        
        // Pre-calculate frustum bounds for optimization
        const frustumBounds = frustumCulling ? this.calculateFrustumBounds() : null;
        
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            
            // Basic visibility check
            if (!star.isVisible()) {
                continue;
            }
            
            // Frustum culling optimization - check if star is in view frustum
            if (frustumCulling && !this.isStarInFrustum(star, frustumBounds)) {
                continue;
            }
            
            const screenPos = star.getScreenPosition(this.camera);
            
            // Screen bounds check with small margin for partially visible stars
            if (screenPos && 
                screenPos.x >= -50 && screenPos.x <= this.canvas.width + 50 &&
                screenPos.y >= -50 && screenPos.y <= this.canvas.height + 50) {
                
                visibleStars.push({
                    star: star,
                    screenPos: screenPos,
                    brightness: star.getBrightness(),
                    size: star.getSize()
                });
            }
        }
        
        return visibleStars;
    }
    
    /**
     * Calculate frustum bounds for culling optimization
     * @returns {Object} Frustum bounds
     */
    calculateFrustumBounds() {
        const camera = this.camera;
        const halfWidth = this.canvas.width / 2;
        const halfHeight = this.canvas.height / 2;
        
        // Calculate view frustum bounds in world space
        // This is a simplified frustum calculation
        return {
            left: -halfWidth - 100,
            right: halfWidth + 100,
            top: -halfHeight - 100,
            bottom: halfHeight + 100,
            near: camera.near,
            far: camera.far
        };
    }
    
    /**
     * Check if star is within view frustum
     * @param {Star} star - Star to check
     * @param {Object} bounds - Frustum bounds
     * @returns {boolean} True if star is in frustum
     */
    isStarInFrustum(star, bounds) {
        // Simple frustum culling - check if star is within reasonable bounds
        // In a full 3D engine, this would use proper frustum planes
        
        // Check Z bounds first (most likely to eliminate stars)
        if (star.z < bounds.near || star.z > bounds.far) {
            return false;
        }
        
        // Rough X/Y bounds check based on distance
        const scale = 1000 / (star.z + 1); // Perspective scaling approximation
        const scaledX = star.x * scale;
        const scaledY = star.y * scale;
        
        return scaledX >= bounds.left && scaledX <= bounds.right &&
               scaledY >= bounds.top && scaledY <= bounds.bottom;
    }
    
    /**
     * Get current FPS
     * @returns {number} Current frames per second
     */
    getFPS() {
        return this.fps;
    }
    
    /**
     * Get total star count
     * @returns {number} Number of stars in the field
     */
    getStarCount() {
        return this.starCount;
    }
    
    /**
     * Get current animation speed
     * @returns {number} Current speed multiplier
     */
    getSpeed() {
        return this.speed;
    }
    
    /**
     * Check if animation is running
     * @returns {boolean} True if animation loop is active
     */
    isAnimating() {
        return this.isRunning;
    }
    
    /**
     * Reset all stars to new random positions
     */
    resetStars() {
        for (let i = 0; i < this.stars.length; i++) {
            this.stars[i].reset();
        }
    }
    
    /**
     * Set color scheme for star rendering
     * @param {string} scheme - Color scheme ('white', 'blue', 'rainbow')
     */
    setColorScheme(scheme) {
        this.renderer.setColorScheme(scheme);
    }
    
    /**
     * Enable or disable trail effects
     * @param {boolean} enabled - Whether trails should be enabled
     */
    setTrailsEnabled(enabled) {
        this.renderer.setTrailsEnabled(enabled);
    }
    
    /**
     * Enable or disable glow effects
     * @param {boolean} enabled - Whether glow should be enabled
     */
    setGlowEnabled(enabled) {
        this.renderer.setGlowEnabled(enabled);
    }
    
    /**
     * Set base star size
     * @param {number} size - Base star size multiplier
     */
    setBaseStarSize(size) {
        this.renderer.setBaseStarSize(size);
    }
    
    /**
     * Get renderer configuration
     * @returns {Object} Current renderer configuration
     */
    getRendererConfig() {
        return this.renderer.getConfig();
    }
    
    /**
     * Get performance monitor instance
     * @returns {PerformanceMonitor} Performance monitor
     */
    getPerformanceMonitor() {
        return this.performanceMonitor;
    }
    
    /**
     * Set performance optimization settings
     * @param {Object} settings - Optimization settings
     */
    setPerformanceSettings(settings) {
        Object.assign(this.performanceOptimizations, settings);
    }
    
    /**
     * Enable or disable automatic performance optimization
     * @param {boolean} enabled - Whether auto-optimization should be enabled
     */
    setAutoOptimization(enabled) {
        this.performanceOptimizations.autoOptimize = enabled;
    }
    
    /**
     * Enable or disable frustum culling
     * @param {boolean} enabled - Whether frustum culling should be enabled
     */
    setFrustumCulling(enabled) {
        this.renderingOptimizations.frustumCulling = enabled;
    }
    
    /**
     * Get current performance statistics
     * @returns {Object} Performance statistics
     */
    getPerformanceStats() {
        const perfStats = this.performanceMonitor.getStats();
        const memInfo = this.performanceMonitor.getMemoryInfo();
        
        return {
            ...perfStats,
            starCount: this.starCount,
            originalStarCount: this.originalStarCount,
            visibleStars: this.getVisibleStars().length,
            optimizations: {
                autoOptimize: this.performanceOptimizations.autoOptimize,
                frustumCulling: this.renderingOptimizations.frustumCulling,
                skipFrames: this.renderingOptimizations.skipFrames
            },
            memory: memInfo
        };
    }
    
    /**
     * Get debug information about the star field
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            starCount: this.starCount,
            originalStarCount: this.originalStarCount,
            speed: this.speed,
            fps: this.fps,
            isRunning: this.isRunning,
            visibleStars: this.getVisibleStars().length,
            camera: this.camera.getDebugInfo(),
            performance: this.getPerformanceStats(),
            optimizations: this.performanceOptimizations,
            rendering: this.renderingOptimizations,
            memory: this.memoryManagement
        };
    }
    
    /**
     * Destroy the star field and clean up resources
     */
    destroy() {
        this.stop();
        this.stars = [];
        this.canvas = null;
        this.ctx = null;
        this.camera = null;
    }
}

// Export for use in other modules (if using modules) or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StarField;
} else {
    window.StarField = StarField;
}