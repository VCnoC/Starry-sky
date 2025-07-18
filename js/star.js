/**
 * Star class representing a single star in 3D space
 * Handles position, movement, and lifecycle management
 */
class Star {
    /**
     * Create a new star with 3D coordinates
     * @param {number} x - X coordinate in 3D space
     * @param {number} y - Y coordinate in 3D space  
     * @param {number} z - Z coordinate in 3D space (distance from viewer)
     */
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        
        // Store previous positions for trail effects
        this.prevX = x;
        this.prevY = y;
        
        // Individual speed multiplier for variation
        this.speed = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
        
        // Maximum distance before reset
        this.maxDistance = 1000;
        
        // Minimum distance (viewer position)
        this.minDistance = 1;
    }
    
    /**
     * Update star position moving toward viewer
     * @param {number} speed - Base movement speed
     * @param {number} deltaTime - Time elapsed since last update (in seconds)
     */
    update(speed = 1.0, deltaTime = 0.016) {
        // Store previous position for trails
        this.prevX = this.x;
        this.prevY = this.y;
        
        // Move star toward viewer (decrease z)
        this.z -= speed * this.speed * deltaTime * 60; // Normalize for 60fps
        
        // Reset star when it reaches viewer position
        if (this.z <= this.minDistance) {
            this.reset();
        }
    }
    
    /**
     * Reset star to distant position with random coordinates
     */
    reset() {
        // Reset to maximum distance
        this.z = this.maxDistance;
        
        // Generate new random position within bounds
        const range = 500; // Range for x and y coordinates
        this.x = (Math.random() - 0.5) * range * 2;
        this.y = (Math.random() - 0.5) * range * 2;
        
        // Update previous positions to prevent trails from old position
        this.prevX = this.x;
        this.prevY = this.y;
        
        // Randomize speed for variation
        this.speed = Math.random() * 0.5 + 0.5;
    }
    
    /**
     * Get screen position from 3D coordinates using perspective projection
     * @param {Object} camera - Camera object with projection methods
     * @returns {Object} Screen coordinates {x, y} or null if behind camera
     */
    getScreenPosition(camera) {
        if (!camera || this.z <= 0) {
            return null;
        }
        
        try {
            return camera.project3DTo2D(this.x, this.y, this.z);
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Calculate star brightness based on distance
     * @returns {number} Brightness value between 0 and 1
     */
    getBrightness() {
        // Brightness increases as star gets closer (z decreases)
        const normalizedDistance = (this.z - this.minDistance) / (this.maxDistance - this.minDistance);
        return Math.max(0, Math.min(1, 1 - normalizedDistance));
    }
    
    /**
     * Calculate star size based on distance
     * @param {number} baseSize - Base size multiplier
     * @returns {number} Calculated size
     */
    getSize(baseSize = 2) {
        const brightness = this.getBrightness();
        return Math.max(0.5, baseSize * brightness);
    }
    
    /**
     * Check if star is visible (within reasonable bounds)
     * @returns {boolean} True if star should be rendered
     */
    isVisible() {
        return this.z >= this.minDistance && this.z <= this.maxDistance;
    }
    
    /**
     * Get star data for debugging
     * @returns {Object} Star state information
     */
    getDebugInfo() {
        return {
            position: { x: this.x, y: this.y, z: this.z },
            prevPosition: { x: this.prevX, y: this.prevY },
            speed: this.speed,
            brightness: this.getBrightness(),
            size: this.getSize(),
            visible: this.isVisible()
        };
    }
}

// Export for use in other modules (if using modules) or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Star;
} else {
    window.Star = Star;
}