/**
 * Camera class for 3D to 2D projection and view management
 * Handles perspective projection, rotation, and viewport transformations
 */
class Camera {
    /**
     * Create a new camera with perspective projection parameters
     * @param {number} fov - Field of view in degrees (default: 75)
     * @param {number} aspect - Aspect ratio (width/height) (default: 1)
     * @param {number} near - Near clipping plane distance (default: 0.1)
     * @param {number} far - Far clipping plane distance (default: 1000)
     */
    constructor(fov = 75, aspect = 1, near = 0.1, far = 1000) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        
        // Rotation angles in radians
        this.rotationX = 0;
        this.rotationY = 0;
        
        // Canvas dimensions for screen space conversion
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        
        // Perspective projection factor
        this.focalLength = this.canvasHeight / (2 * Math.tan((this.fov * Math.PI / 180) / 2));
        
        // Update focal length when aspect changes
        this.updateProjection();
    }
    
    /**
     * Update projection parameters when canvas size changes
     */
    updateProjection() {
        this.focalLength = this.canvasHeight / (2 * Math.tan((this.fov * Math.PI / 180) / 2));
    }
    
    /**
     * Project 3D coordinates to 2D screen space
     * @param {number} x - X coordinate in 3D space
     * @param {number} y - Y coordinate in 3D space
     * @param {number} z - Z coordinate in 3D space (distance from camera)
     * @returns {Object|null} Screen coordinates {x, y} or null if behind camera
     */
    project3DTo2D(x, y, z) {
        // Check if point is behind camera or at camera position
        if (z <= 0) {
            return null;
        }
        
        // Apply camera rotation transformations
        const rotatedPoint = this.applyRotation(x, y, z);
        
        // Check again after rotation
        if (rotatedPoint.z <= 0) {
            return null;
        }
        
        // Perspective projection
        const projectedX = (rotatedPoint.x * this.focalLength) / rotatedPoint.z;
        const projectedY = (rotatedPoint.y * this.focalLength) / rotatedPoint.z;
        
        // Convert to screen coordinates (center of canvas is origin)
        const screenX = projectedX + this.canvasWidth / 2;
        const screenY = projectedY + this.canvasHeight / 2;
        
        return {
            x: screenX,
            y: screenY,
            z: rotatedPoint.z // Keep z for depth sorting
        };
    }
    
    /**
     * Apply camera rotation to 3D point
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate  
     * @param {number} z - Z coordinate
     * @returns {Object} Rotated coordinates {x, y, z}
     */
    applyRotation(x, y, z) {
        // Apply Y-axis rotation (horizontal mouse movement)
        const cosY = Math.cos(this.rotationY);
        const sinY = Math.sin(this.rotationY);
        
        const rotatedX = x * cosY - z * sinY;
        const rotatedZ = x * sinY + z * cosY;
        
        // Apply X-axis rotation (vertical mouse movement)
        const cosX = Math.cos(this.rotationX);
        const sinX = Math.sin(this.rotationX);
        
        const finalY = y * cosX - rotatedZ * sinX;
        const finalZ = y * sinX + rotatedZ * cosX;
        
        return {
            x: rotatedX,
            y: finalY,
            z: finalZ
        };
    }
    
    /**
     * Set camera rotation from mouse input
     * @param {number} rotX - X-axis rotation in radians
     * @param {number} rotY - Y-axis rotation in radians
     */
    setRotation(rotX, rotY) {
        this.rotationX = rotX;
        this.rotationY = rotY;
    }
    
    /**
     * Update aspect ratio and canvas dimensions
     * @param {number} width - Canvas width in pixels
     * @param {number} height - Canvas height in pixels
     */
    updateAspectRatio(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.aspect = width / height;
        this.updateProjection();
    }
    
    /**
     * Convert mouse coordinates to rotation angles
     * @param {number} mouseX - Mouse X position (0 to canvas width)
     * @param {number} mouseY - Mouse Y position (0 to canvas height)
     * @param {number} sensitivity - Mouse sensitivity multiplier (default: 0.005)
     * @returns {Object} Rotation angles {rotX, rotY}
     */
    mouseToRotation(mouseX, mouseY, sensitivity = 0.005) {
        // Convert mouse position to centered coordinates (-0.5 to 0.5)
        const normalizedX = (mouseX / this.canvasWidth) - 0.5;
        const normalizedY = (mouseY / this.canvasHeight) - 0.5;
        
        // Convert to rotation angles
        const rotY = normalizedX * Math.PI * sensitivity * 100; // Horizontal rotation
        const rotX = normalizedY * Math.PI * sensitivity * 100; // Vertical rotation
        
        return {
            rotX: rotX,
            rotY: rotY
        };
    }
    
    /**
     * Check if a 3D point is within the camera's view frustum
     * @param {number} x - X coordinate in 3D space
     * @param {number} y - Y coordinate in 3D space
     * @param {number} z - Z coordinate in 3D space
     * @returns {boolean} True if point is visible
     */
    isInViewFrustum(x, y, z) {
        // Check depth bounds
        if (z <= this.near || z >= this.far) {
            return false;
        }
        
        // Apply rotation to get camera-relative coordinates
        const rotated = this.applyRotation(x, y, z);
        
        // Check if behind camera after rotation
        if (rotated.z <= 0) {
            return false;
        }
        
        // Calculate view bounds at this depth
        const halfHeight = Math.tan((this.fov * Math.PI / 180) / 2) * rotated.z;
        const halfWidth = halfHeight * this.aspect;
        
        // Check if point is within view bounds
        return Math.abs(rotated.x) <= halfWidth && Math.abs(rotated.y) <= halfHeight;
    }
    
    /**
     * Get camera state for debugging
     * @returns {Object} Camera state information
     */
    getDebugInfo() {
        return {
            fov: this.fov,
            aspect: this.aspect,
            near: this.near,
            far: this.far,
            rotation: {
                x: this.rotationX,
                y: this.rotationY
            },
            canvas: {
                width: this.canvasWidth,
                height: this.canvasHeight
            },
            focalLength: this.focalLength
        };
    }
    
    /**
     * Reset camera to default state
     */
    reset() {
        this.rotationX = 0;
        this.rotationY = 0;
    }
}

// Export for use in other modules (if using modules) or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Camera;
} else {
    window.Camera = Camera;
}