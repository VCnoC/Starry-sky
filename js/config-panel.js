/**
 * ConfigPanel class for managing user interface controls and configuration
 * Handles input validation, range clamping, and real-time updates to the star field
 */
class ConfigPanel {
    /**
     * Create a new configuration panel
     * @param {StarField} starField - StarField instance to control
     * @param {InputHandler} inputHandler - InputHandler instance for mouse controls
     */
    constructor(starField, inputHandler) {
        this.starField = starField;
        this.inputHandler = inputHandler;
        
        // Configuration state
        this.config = {
            starCount: 1000,
            speed: 1.0,
            colorScheme: 'white',
            mouseRotation: true,
            trailEffect: true
        };
        
        // DOM element references
        this.elements = {};
        
        // Performance tracking
        this.performanceUpdateInterval = null;
        
        // Initialize the panel
        this.initialize();
    }
    
    /**
     * Initialize the configuration panel
     */
    initialize() {
        this.cacheElements();
        this.attachEventListeners();
        this.updateDisplayValues();
        this.startPerformanceMonitoring();
    }
    
    /**
     * Cache DOM element references for better performance
     */
    cacheElements() {
        this.elements = {
            starCount: document.getElementById('star-count'),
            starCountValue: document.getElementById('star-count-value'),
            speed: document.getElementById('speed'),
            speedValue: document.getElementById('speed-value'),
            colorScheme: document.getElementById('color-scheme'),
            mouseRotation: document.getElementById('mouse-rotation'),
            trailEffect: document.getElementById('trail-effect'),
            fpsCounter: document.getElementById('fps-counter'),
            activeStars: document.getElementById('active-stars')
        };
        
        // Validate that all required elements exist
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element) {
                console.warn(`ConfigPanel: Element '${key}' not found in DOM`);
            }
        }
    }
    
    /**
     * Attach event listeners to control elements
     */
    attachEventListeners() {
        // Star count slider
        if (this.elements.starCount) {
            this.elements.starCount.addEventListener('input', (e) => {
                this.handleStarCountChange(parseInt(e.target.value));
            });
        }
        
        // Speed slider
        if (this.elements.speed) {
            this.elements.speed.addEventListener('input', (e) => {
                this.handleSpeedChange(parseFloat(e.target.value));
            });
        }
        
        // Color scheme dropdown
        if (this.elements.colorScheme) {
            this.elements.colorScheme.addEventListener('change', (e) => {
                this.handleColorSchemeChange(e.target.value);
            });
        }
        
        // Mouse rotation checkbox
        if (this.elements.mouseRotation) {
            this.elements.mouseRotation.addEventListener('change', (e) => {
                this.handleMouseRotationChange(e.target.checked);
            });
        }
        
        // Trail effect checkbox
        if (this.elements.trailEffect) {
            this.elements.trailEffect.addEventListener('change', (e) => {
                this.handleTrailEffectChange(e.target.checked);
            });
        }
    }
    
    /**
     * Handle star count changes with validation
     * @param {number} count - New star count
     */
    handleStarCountChange(count) {
        // Validate and clamp the value
        const validCount = this.validateStarCount(count);
        
        if (validCount !== this.config.starCount) {
            this.config.starCount = validCount;
            this.starField.setStarCount(validCount);
            this.updateStarCountDisplay(validCount);
        }
    }
    
    /**
     * Handle speed changes with validation
     * @param {number} speed - New speed value
     */
    handleSpeedChange(speed) {
        // Validate and clamp the value
        const validSpeed = this.validateSpeed(speed);
        
        if (validSpeed !== this.config.speed) {
            this.config.speed = validSpeed;
            this.starField.setSpeed(validSpeed);
            this.updateSpeedDisplay(validSpeed);
        }
    }
    
    /**
     * Handle color scheme changes
     * @param {string} scheme - New color scheme
     */
    handleColorSchemeChange(scheme) {
        if (this.validateColorScheme(scheme)) {
            this.config.colorScheme = scheme;
            this.starField.setColorScheme(scheme);
        }
    }
    
    /**
     * Handle mouse rotation toggle
     * @param {boolean} enabled - Whether mouse rotation is enabled
     */
    handleMouseRotationChange(enabled) {
        this.config.mouseRotation = enabled;
        
        if (this.inputHandler) {
            if (enabled) {
                // Re-enable mouse rotation by restarting update loop
                this.inputHandler.startUpdateLoop();
            } else {
                // Disable mouse rotation and reset to center
                this.inputHandler.reset();
                this.inputHandler.stopUpdateLoop();
            }
        }
    }
    
    /**
     * Handle trail effect toggle
     * @param {boolean} enabled - Whether trail effects are enabled
     */
    handleTrailEffectChange(enabled) {
        this.config.trailEffect = enabled;
        this.starField.setTrailsEnabled(enabled);
    }
    
    /**
     * Validate star count input
     * @param {number} count - Star count to validate
     * @returns {number} Valid star count
     */
    validateStarCount(count) {
        const min = 100;
        const max = 5000;
        
        if (isNaN(count)) {
            return this.config.starCount; // Return current value if invalid
        }
        
        return Math.max(min, Math.min(max, Math.floor(count)));
    }
    
    /**
     * Validate speed input
     * @param {number} speed - Speed to validate
     * @returns {number} Valid speed
     */
    validateSpeed(speed) {
        const min = 0.1;
        const max = 5.0;
        
        if (isNaN(speed)) {
            return this.config.speed; // Return current value if invalid
        }
        
        return Math.max(min, Math.min(max, parseFloat(speed.toFixed(1))));
    }
    
    /**
     * Validate color scheme input
     * @param {string} scheme - Color scheme to validate
     * @returns {boolean} Whether the scheme is valid
     */
    validateColorScheme(scheme) {
        const validSchemes = ['white', 'blue-white', 'warm', 'cool', 'rainbow', 'nebula'];
        return validSchemes.includes(scheme);
    }
    
    /**
     * Update all display values to match current configuration
     */
    updateDisplayValues() {
        this.updateStarCountDisplay(this.config.starCount);
        this.updateSpeedDisplay(this.config.speed);
        
        // Update form controls to match current config
        if (this.elements.starCount) {
            this.elements.starCount.value = this.config.starCount;
        }
        
        if (this.elements.speed) {
            this.elements.speed.value = this.config.speed;
        }
        
        if (this.elements.colorScheme) {
            this.elements.colorScheme.value = this.config.colorScheme;
        }
        
        if (this.elements.mouseRotation) {
            this.elements.mouseRotation.checked = this.config.mouseRotation;
        }
        
        if (this.elements.trailEffect) {
            this.elements.trailEffect.checked = this.config.trailEffect;
        }
    }
    
    /**
     * Update star count display value
     * @param {number} count - Star count to display
     */
    updateStarCountDisplay(count) {
        if (this.elements.starCountValue) {
            this.elements.starCountValue.textContent = count.toLocaleString();
        }
    }
    
    /**
     * Update speed display value
     * @param {number} speed - Speed to display
     */
    updateSpeedDisplay(speed) {
        if (this.elements.speedValue) {
            this.elements.speedValue.textContent = speed.toFixed(1);
        }
    }
    
    /**
     * Start performance monitoring updates
     */
    startPerformanceMonitoring() {
        // Update performance info every 500ms
        this.performanceUpdateInterval = setInterval(() => {
            this.updatePerformanceInfo();
        }, 500);
    }
    
    /**
     * Stop performance monitoring updates
     */
    stopPerformanceMonitoring() {
        if (this.performanceUpdateInterval) {
            clearInterval(this.performanceUpdateInterval);
            this.performanceUpdateInterval = null;
        }
    }
    
    /**
     * Update performance information display
     */
    updatePerformanceInfo() {
        if (this.starField) {
            // Update FPS counter
            if (this.elements.fpsCounter) {
                const fps = this.starField.getFPS();
                this.elements.fpsCounter.textContent = fps.toString();
            }
            
            // Update active stars count
            if (this.elements.activeStars) {
                const starCount = this.starField.getStarCount();
                this.elements.activeStars.textContent = starCount.toLocaleString();
            }
        }
    }
    
    /**
     * Get current configuration
     * @returns {Object} Current configuration object
     */
    getConfig() {
        return { ...this.config };
    }
    
    /**
     * Set configuration programmatically
     * @param {Object} newConfig - Configuration object to apply
     */
    setConfig(newConfig) {
        // Validate and apply each configuration option
        if (newConfig.starCount !== undefined) {
            const validCount = this.validateStarCount(newConfig.starCount);
            this.config.starCount = validCount;
            this.starField.setStarCount(validCount);
        }
        
        if (newConfig.speed !== undefined) {
            const validSpeed = this.validateSpeed(newConfig.speed);
            this.config.speed = validSpeed;
            this.starField.setSpeed(validSpeed);
        }
        
        if (newConfig.colorScheme !== undefined && this.validateColorScheme(newConfig.colorScheme)) {
            this.config.colorScheme = newConfig.colorScheme;
            this.starField.setColorScheme(newConfig.colorScheme);
        }
        
        if (newConfig.mouseRotation !== undefined) {
            this.config.mouseRotation = newConfig.mouseRotation;
            this.handleMouseRotationChange(newConfig.mouseRotation);
        }
        
        if (newConfig.trailEffect !== undefined) {
            this.config.trailEffect = newConfig.trailEffect;
            this.starField.setTrailsEnabled(newConfig.trailEffect);
        }
        
        // Update display to reflect changes
        this.updateDisplayValues();
    }
    
    /**
     * Reset configuration to default values
     */
    resetToDefaults() {
        const defaultConfig = {
            starCount: 1000,
            speed: 1.0,
            colorScheme: 'white',
            mouseRotation: true,
            trailEffect: true
        };
        
        this.setConfig(defaultConfig);
    }
    
    /**
     * Get debug information about the configuration panel
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            config: this.getConfig(),
            elementsFound: Object.keys(this.elements).filter(key => this.elements[key] !== null),
            elementsMissing: Object.keys(this.elements).filter(key => this.elements[key] === null),
            performanceMonitoring: this.performanceUpdateInterval !== null
        };
    }
    
    /**
     * Clean up the configuration panel
     */
    destroy() {
        // Stop performance monitoring
        this.stopPerformanceMonitoring();
        
        // Remove event listeners (they'll be cleaned up automatically when elements are removed)
        // Clear references
        this.starField = null;
        this.inputHandler = null;
        this.elements = {};
    }
}

// Export for use in other modules (if using modules) or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigPanel;
} else {
    window.ConfigPanel = ConfigPanel;
}