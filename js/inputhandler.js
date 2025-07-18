/**
 * InputHandler class for processing mouse input and converting to smooth camera rotation
 * Handles mouse movement, sensitivity, boundary conditions, and smooth interpolation
 */
class InputHandler {
    /**
     * Create a new input handler for mouse and touch-based camera control
     * @param {HTMLCanvasElement} canvas - Canvas element to attach events to
     * @param {Function} rotationCallback - Callback function to receive rotation updates
     * @param {Object} options - Configuration options
     */
    constructor(canvas, rotationCallback, options = {}) {
        this.canvas = canvas;
        this.rotationCallback = rotationCallback;
        
        // Configuration options with defaults
        this.sensitivity = options.sensitivity || 0.003;
        this.smoothing = options.smoothing || 0.1;
        this.maxRotation = options.maxRotation || Math.PI / 2; // 90 degrees max
        this.invertY = options.invertY || false;
        this.touchSensitivity = options.touchSensitivity || 0.002; // Lower for touch
        
        // Current rotation state
        this.currentRotationX = 0;
        this.currentRotationY = 0;
        
        // Target rotation (what we're smoothly moving toward)
        this.targetRotationX = 0;
        this.targetRotationY = 0;
        
        // Mouse state
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Touch state
        this.isTouchActive = false;
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.touchX = 0;
        this.touchY = 0;
        this.touchStartTime = 0;
        this.multiTouchActive = false;
        
        // Device detection
        this.isMobile = this.detectMobileDevice();
        this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Animation frame for smooth updates
        this.animationFrame = null;
        this.isUpdating = false;
        
        // Bind event handlers
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleTouchCancel = this.handleTouchCancel.bind(this);
        this.update = this.update.bind(this);
        
        // Attach event listeners
        this.attachEventListeners();
        
        // Start smooth update loop
        this.startUpdateLoop();
    }
    
    /**
     * Attach mouse and touch event listeners to the canvas
     */
    attachEventListeners() {
        // Mouse events (for desktop)
        this.canvas.addEventListener('mousemove', this.handleMouseMove, { passive: true });
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
        this.canvas.addEventListener('contextmenu', this.handleContextMenu);
        
        // Touch events (for mobile)
        if (this.isTouch) {
            this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
            this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
            this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: true });
            this.canvas.addEventListener('touchcancel', this.handleTouchCancel, { passive: true });
        }
        
        // Ensure canvas can receive focus for better interaction
        this.canvas.tabIndex = 0;
    }
    
    /**
     * Handle mouse movement events
     * @param {MouseEvent} event - Mouse move event
     */
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
        
        // Calculate mouse delta for smooth rotation
        if (this.isMouseDown) {
            const deltaX = this.mouseX - this.lastMouseX;
            const deltaY = this.mouseY - this.lastMouseY;
            
            // Apply sensitivity and inversion
            const rotationDeltaY = deltaX * this.sensitivity;
            const rotationDeltaX = deltaY * this.sensitivity * (this.invertY ? -1 : 1);
            
            // Update target rotation with deltas
            this.targetRotationY += rotationDeltaY;
            this.targetRotationX += rotationDeltaX;
            
            // Apply rotation boundaries
            this.applyRotationBounds();
        }
        
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
    }
    
    /**
     * Handle mouse down events
     * @param {MouseEvent} event - Mouse down event
     */
    handleMouseDown(event) {
        this.isMouseDown = true;
        this.canvas.style.cursor = 'grabbing';
        
        // Prevent default to avoid text selection
        event.preventDefault();
    }
    
    /**
     * Handle mouse up events
     * @param {MouseEvent} event - Mouse up event
     */
    handleMouseUp(event) {
        this.isMouseDown = false;
        this.canvas.style.cursor = 'grab';
    }
    
    /**
     * Handle mouse leave events
     * @param {MouseEvent} event - Mouse leave event
     */
    handleMouseLeave(event) {
        this.isMouseDown = false;
        this.canvas.style.cursor = 'default';
    }
    
    /**
     * Handle context menu events (prevent right-click menu)
     * @param {MouseEvent} event - Context menu event
     */
    handleContextMenu(event) {
        event.preventDefault();
    }
    
    /**
     * Handle touch start events
     * @param {TouchEvent} event - Touch start event
     */
    handleTouchStart(event) {
        // Prevent default to avoid scrolling and zooming
        event.preventDefault();
        
        const touches = event.touches;
        
        // Only handle single touch for rotation
        if (touches.length === 1) {
            this.isTouchActive = true;
            this.multiTouchActive = false;
            this.touchStartTime = performance.now();
            
            const rect = this.canvas.getBoundingClientRect();
            this.touchX = touches[0].clientX - rect.left;
            this.touchY = touches[0].clientY - rect.top;
            this.lastTouchX = this.touchX;
            this.lastTouchY = this.touchY;
            
            // Visual feedback
            this.canvas.style.cursor = 'grabbing';
        } else if (touches.length > 1) {
            // Multi-touch detected, disable rotation
            this.isTouchActive = false;
            this.multiTouchActive = true;
            this.canvas.style.cursor = 'default';
        }
    }
    
    /**
     * Handle touch move events
     * @param {TouchEvent} event - Touch move event
     */
    handleTouchMove(event) {
        // Prevent default to avoid scrolling
        event.preventDefault();
        
        const touches = event.touches;
        
        // Only handle single touch for rotation
        if (touches.length === 1 && this.isTouchActive && !this.multiTouchActive) {
            const rect = this.canvas.getBoundingClientRect();
            this.touchX = touches[0].clientX - rect.left;
            this.touchY = touches[0].clientY - rect.top;
            
            // Calculate touch delta for smooth rotation
            const deltaX = this.touchX - this.lastTouchX;
            const deltaY = this.touchY - this.lastTouchY;
            
            // Apply touch sensitivity (usually lower than mouse)
            const rotationDeltaY = deltaX * this.touchSensitivity;
            const rotationDeltaX = deltaY * this.touchSensitivity * (this.invertY ? -1 : 1);
            
            // Update target rotation with deltas
            this.targetRotationY += rotationDeltaY;
            this.targetRotationX += rotationDeltaX;
            
            // Apply rotation boundaries
            this.applyRotationBounds();
            
            this.lastTouchX = this.touchX;
            this.lastTouchY = this.touchY;
        }
    }
    
    /**
     * Handle touch end events
     * @param {TouchEvent} event - Touch end event
     */
    handleTouchEnd(event) {
        const touches = event.touches;
        
        if (touches.length === 0) {
            // All touches ended
            this.isTouchActive = false;
            this.multiTouchActive = false;
            this.canvas.style.cursor = 'default';
        } else if (touches.length === 1 && this.multiTouchActive) {
            // Back to single touch from multi-touch
            this.multiTouchActive = false;
            this.isTouchActive = true;
            
            const rect = this.canvas.getBoundingClientRect();
            this.touchX = touches[0].clientX - rect.left;
            this.touchY = touches[0].clientY - rect.top;
            this.lastTouchX = this.touchX;
            this.lastTouchY = this.touchY;
            
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    /**
     * Handle touch cancel events
     * @param {TouchEvent} event - Touch cancel event
     */
    handleTouchCancel(event) {
        this.isTouchActive = false;
        this.multiTouchActive = false;
        this.canvas.style.cursor = 'default';
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
     * Apply rotation boundaries to prevent over-rotation
     */
    applyRotationBounds() {
        // Clamp X rotation (vertical) to prevent flipping
        this.targetRotationX = Math.max(-this.maxRotation, 
            Math.min(this.maxRotation, this.targetRotationX));
        
        // Y rotation (horizontal) can rotate freely, but normalize to prevent accumulation
        while (this.targetRotationY > Math.PI) {
            this.targetRotationY -= 2 * Math.PI;
        }
        while (this.targetRotationY < -Math.PI) {
            this.targetRotationY += 2 * Math.PI;
        }
    }
    
    /**
     * Start the smooth update loop
     */
    startUpdateLoop() {
        if (!this.isUpdating) {
            this.isUpdating = true;
            this.update();
        }
    }
    
    /**
     * Stop the smooth update loop
     */
    stopUpdateLoop() {
        this.isUpdating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    /**
     * Smooth update loop for interpolating rotation
     */
    update() {
        if (!this.isUpdating) return;
        
        // Smooth interpolation toward target rotation
        const deltaX = this.targetRotationX - this.currentRotationX;
        const deltaY = this.targetRotationY - this.currentRotationY;
        
        // Apply smoothing
        this.currentRotationX += deltaX * this.smoothing;
        this.currentRotationY += deltaY * this.smoothing;
        
        // Call rotation callback with current smooth rotation
        if (this.rotationCallback) {
            this.rotationCallback(this.currentRotationX, this.currentRotationY);
        }
        
        // Continue update loop
        this.animationFrame = requestAnimationFrame(this.update);
    }
    
    /**
     * Set mouse sensitivity
     * @param {number} sensitivity - New sensitivity value (0.001 to 0.01 recommended)
     */
    setSensitivity(sensitivity) {
        this.sensitivity = Math.max(0.001, Math.min(0.01, sensitivity));
    }
    
    /**
     * Set smoothing factor
     * @param {number} smoothing - Smoothing factor (0.01 to 1.0)
     */
    setSmoothing(smoothing) {
        this.smoothing = Math.max(0.01, Math.min(1.0, smoothing));
    }
    
    /**
     * Set maximum rotation angle
     * @param {number} maxRotation - Maximum rotation in radians
     */
    setMaxRotation(maxRotation) {
        this.maxRotation = Math.max(0, Math.min(Math.PI, maxRotation));
    }
    
    /**
     * Toggle Y-axis inversion
     * @param {boolean} invert - Whether to invert Y-axis
     */
    setInvertY(invert) {
        this.invertY = invert;
    }
    
    /**
     * Reset rotation to center
     */
    reset() {
        this.currentRotationX = 0;
        this.currentRotationY = 0;
        this.targetRotationX = 0;
        this.targetRotationY = 0;
    }
    
    /**
     * Get current rotation state
     * @returns {Object} Current rotation {x, y}
     */
    getRotation() {
        return {
            x: this.currentRotationX,
            y: this.currentRotationY
        };
    }
    
    /**
     * Get target rotation state
     * @returns {Object} Target rotation {x, y}
     */
    getTargetRotation() {
        return {
            x: this.targetRotationX,
            y: this.targetRotationY
        };
    }
    
    /**
     * Get input handler configuration
     * @returns {Object} Configuration object
     */
    getConfig() {
        return {
            sensitivity: this.sensitivity,
            smoothing: this.smoothing,
            maxRotation: this.maxRotation,
            invertY: this.invertY
        };
    }
    
    /**
     * Check if mouse is currently pressed
     * @returns {boolean} True if mouse is down
     */
    isMousePressed() {
        return this.isMouseDown;
    }
    
    /**
     * Get current mouse position relative to canvas
     * @returns {Object} Mouse position {x, y}
     */
    getMousePosition() {
        return {
            x: this.mouseX,
            y: this.mouseY
        };
    }
    
    /**
     * Check if device is mobile
     * @returns {boolean} True if mobile device
     */
    isMobileDevice() {
        return this.isMobile;
    }
    
    /**
     * Check if device supports touch
     * @returns {boolean} True if touch is supported
     */
    isTouchDevice() {
        return this.isTouch;
    }
    
    /**
     * Get touch sensitivity
     * @returns {number} Current touch sensitivity
     */
    getTouchSensitivity() {
        return this.touchSensitivity;
    }
    
    /**
     * Set touch sensitivity
     * @param {number} sensitivity - New touch sensitivity value
     */
    setTouchSensitivity(sensitivity) {
        this.touchSensitivity = Math.max(0.0005, Math.min(0.005, sensitivity));
    }
    
    /**
     * Clean up event listeners and stop updates
     */
    destroy() {
        // Stop update loop
        this.stopUpdateLoop();
        
        // Remove mouse event listeners
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mousedown', this.handleMouseDown);
            this.canvas.removeEventListener('mouseup', this.handleMouseUp);
            this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
            this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
            
            // Remove touch event listeners
            if (this.isTouch) {
                this.canvas.removeEventListener('touchstart', this.handleTouchStart);
                this.canvas.removeEventListener('touchmove', this.handleTouchMove);
                this.canvas.removeEventListener('touchend', this.handleTouchEnd);
                this.canvas.removeEventListener('touchcancel', this.handleTouchCancel);
            }
            
            // Reset cursor
            this.canvas.style.cursor = 'default';
        }
        
        // Clear references
        this.canvas = null;
        this.rotationCallback = null;
    }
}

// Export for use in other modules (if using modules) or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputHandler;
} else {
    window.InputHandler = InputHandler;
}