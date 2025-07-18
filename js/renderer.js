/**
 * Renderer class for drawing stars on canvas with visual effects
 * Handles star rendering, size scaling, brightness, and trail effects
 */
class Renderer {
    /**
     * Create a new renderer for the given canvas
     * @param {HTMLCanvasElement} canvas - Canvas element for rendering
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Rendering configuration
        this.config = {
            baseStarSize: 2,
            maxStarSize: 8,
            minStarSize: 0.5,
            trailLength: 0.3,
            glowRadius: 4,
            colorScheme: 'white',
            enableTrails: true,
            enableGlow: true,
            batchRendering: true,
            maxBatchSize: 100
        };
        
        // Enhanced color schemes with better visual properties
        this.colorSchemes = {
            white: { 
                r: 255, g: 255, b: 255,
                name: 'Pure White',
                description: 'Classic white stars'
            },
            'blue-white': { 
                r: 200, g: 220, b: 255,
                name: 'Blue-White',
                description: 'Cool blue-white stars like hot stars'
            },
            rainbow: {
                name: 'Rainbow',
                description: 'Dynamic rainbow colors',
                // Special case - calculated per star
                dynamic: true
            },
            warm: {
                r: 255, g: 220, b: 180,
                name: 'Warm White',
                description: 'Warm yellowish stars like our sun'
            },
            cool: {
                r: 180, g: 200, b: 255,
                name: 'Cool Blue',
                description: 'Cool blue stars'
            },
            nebula: {
                name: 'Nebula',
                description: 'Purple and pink nebula colors',
                dynamic: true
            }
        };
        
        // Color transition state for smooth changes
        this.colorTransition = {
            isTransitioning: false,
            startTime: 0,
            duration: 1000, // 1 second transition
            fromScheme: null,
            toScheme: null,
            progress: 0
        };
        
        // Performance optimization
        this.lastClearTime = 0;
        this.clearInterval = 16; // Clear every ~60fps
    }
    
    /**
     * Render all visible stars with visual effects
     * @param {Array} visibleStars - Array of star data with screen positions
     * @param {number} currentTime - Current timestamp for animations
     */
    render(visibleStars, currentTime = 0) {
        // Clear canvas with fade effect for trails
        this.clearCanvas(currentTime);
        
        // Sort stars by depth (z-coordinate) for proper rendering order
        const sortedStars = this.sortStarsByDepth(visibleStars);
        
        // Use batch rendering if enabled and beneficial
        if (this.config.batchRendering && sortedStars.length > 50) {
            this.renderStarsBatched(sortedStars, currentTime);
        } else {
            // Render each star individually
            for (const starData of sortedStars) {
                this.renderStar(starData, currentTime);
            }
        }
    }
    
    /**
     * Render stars using batch optimization
     * @param {Array} sortedStars - Sorted array of star data
     * @param {number} currentTime - Current timestamp for animations
     */
    renderStarsBatched(sortedStars, currentTime) {
        const maxBatchSize = this.config.maxBatchSize || 100;
        
        // Group stars by similar properties for batching
        const batches = this.groupStarsForBatching(sortedStars);
        
        // Render each batch
        for (const batch of batches) {
            this.renderStarBatch(batch, currentTime);
        }
    }
    
    /**
     * Group stars into batches based on similar rendering properties
     * @param {Array} stars - Array of star data
     * @returns {Array} Array of batches
     */
    groupStarsForBatching(stars) {
        const batches = [];
        let currentBatch = [];
        let currentBatchType = null;
        
        for (const starData of stars) {
            const batchType = this.getStarBatchType(starData);
            
            // Start new batch if type changed or batch is full
            if (currentBatchType !== batchType || 
                currentBatch.length >= (this.config.maxBatchSize || 100)) {
                
                if (currentBatch.length > 0) {
                    batches.push({
                        type: currentBatchType,
                        stars: currentBatch
                    });
                }
                
                currentBatch = [starData];
                currentBatchType = batchType;
            } else {
                currentBatch.push(starData);
            }
        }
        
        // Add final batch
        if (currentBatch.length > 0) {
            batches.push({
                type: currentBatchType,
                stars: currentBatch
            });
        }
        
        return batches;
    }
    
    /**
     * Determine batch type for a star based on its rendering properties
     * @param {Object} starData - Star data
     * @returns {string} Batch type identifier
     */
    getStarBatchType(starData) {
        const { brightness, size } = starData;
        
        // Group by brightness and size ranges for similar rendering
        const brightnessGroup = brightness > 0.7 ? 'bright' : brightness > 0.3 ? 'medium' : 'dim';
        const sizeGroup = size > 4 ? 'large' : size > 2 ? 'medium' : 'small';
        
        return `${brightnessGroup}-${sizeGroup}`;
    }
    
    /**
     * Render a batch of similar stars efficiently
     * @param {Object} batch - Batch of stars with similar properties
     * @param {number} currentTime - Current timestamp
     */
    renderStarBatch(batch, currentTime) {
        const { type, stars } = batch;
        
        if (stars.length === 0) return;
        
        // Set up common rendering properties for the batch
        const sampleStar = stars[0];
        const color = this.getStarColor(sampleStar.star, sampleStar.brightness, currentTime);
        
        // Begin path for batch rendering
        this.ctx.beginPath();
        
        // Add all stars in batch to the path
        for (const starData of stars) {
            const { screenPos, size } = starData;
            this.ctx.moveTo(screenPos.x + size/2, screenPos.y);
            this.ctx.arc(screenPos.x, screenPos.y, size/2, 0, Math.PI * 2);
        }
        
        // Render all stars in batch with single fill operation
        const alpha = Math.max(0.1, sampleStar.brightness);
        this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        this.ctx.fill();
        
        // Render glow effects for bright stars in batch
        if (this.config.enableGlow) {
            this.renderBatchGlowEffects(stars, currentTime);
        }
    }
    
    /**
     * Render glow effects for a batch of bright stars
     * @param {Array} stars - Array of star data
     * @param {number} currentTime - Current timestamp
     */
    renderBatchGlowEffects(stars, currentTime) {
        for (const starData of stars) {
            if (starData.brightness > 0.3) {
                const color = this.getStarColor(starData.star, starData.brightness, currentTime);
                this.drawGlow(starData.screenPos.x, starData.screenPos.y, 
                             starData.size, color, starData.brightness);
            }
        }
    }
    
    /**
     * Clear canvas with optional fade effect for trails
     * @param {number} currentTime - Current timestamp
     */
    clearCanvas(currentTime) {
        if (this.config.enableTrails) {
            // Create fade effect by drawing semi-transparent black rectangle
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.config.trailLength})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Full clear for no trails
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    /**
     * Sort stars by depth for proper rendering order (far to near)
     * @param {Array} visibleStars - Array of star data
     * @returns {Array} Sorted array of star data
     */
    sortStarsByDepth(visibleStars) {
        return visibleStars.slice().sort((a, b) => b.screenPos.z - a.screenPos.z);
    }
    
    /**
     * Render a single star with visual effects
     * @param {Object} starData - Star data with screen position, brightness, size
     * @param {number} currentTime - Current timestamp for animations
     */
    renderStar(starData, currentTime) {
        const { star, screenPos, brightness, size } = starData;
        
        // Calculate final star size based on distance and configuration
        const finalSize = this.calculateStarSize(brightness, size);
        
        // Get star color based on scheme and properties
        const color = this.getStarColor(star, brightness, currentTime);
        
        // Draw glow effect if enabled and star is bright enough
        if (this.config.enableGlow && brightness > 0.3) {
            this.drawGlow(screenPos.x, screenPos.y, finalSize, color, brightness);
        }
        
        // Draw the main star
        this.drawStar(screenPos.x, screenPos.y, finalSize, color, brightness);
        
        // Draw trail effect if enabled
        if (this.config.enableTrails && star.prevX !== undefined) {
            this.drawTrail(star, screenPos, color, brightness);
        }
    }
    
    /**
     * Calculate final star size based on brightness and base size
     * @param {number} brightness - Star brightness (0-1)
     * @param {number} baseSize - Base size from star calculation
     * @returns {number} Final star size
     */
    calculateStarSize(brightness, baseSize) {
        const scaledSize = baseSize * this.config.baseStarSize;
        return Math.max(
            this.config.minStarSize,
            Math.min(this.config.maxStarSize, scaledSize)
        );
    }
    
    /**
     * Get star color based on color scheme and properties with smooth transitions
     * @param {Object} star - Star object
     * @param {number} brightness - Star brightness (0-1)
     * @param {number} currentTime - Current timestamp for animations
     * @returns {Object} Color object with r, g, b values
     */
    getStarColor(star, brightness, currentTime) {
        // Update color transition progress
        this.updateColorTransition(currentTime);
        
        let baseColor;
        
        // Handle dynamic color schemes
        if (this.config.colorScheme === 'rainbow') {
            baseColor = this.getRainbowColor(star, currentTime);
        } else if (this.config.colorScheme === 'nebula') {
            baseColor = this.getNebulaColor(star, currentTime);
        } else {
            // Static color schemes
            const scheme = this.colorSchemes[this.config.colorScheme] || this.colorSchemes.white;
            baseColor = { r: scheme.r, g: scheme.g, b: scheme.b };
        }
        
        // Apply color transition if active
        if (this.colorTransition.isTransitioning) {
            baseColor = this.blendColors(
                this.getSchemeColor(this.colorTransition.fromScheme, star, currentTime),
                baseColor,
                this.colorTransition.progress
            );
        }
        
        // Apply brightness and ensure proper contrast against black background
        const finalColor = this.applyBrightnessAndContrast(baseColor, brightness);
        
        return finalColor;
    }
    
    /**
     * Update color transition progress
     * @param {number} currentTime - Current timestamp
     */
    updateColorTransition(currentTime) {
        if (!this.colorTransition.isTransitioning) return;
        
        const elapsed = currentTime - this.colorTransition.startTime;
        this.colorTransition.progress = Math.min(elapsed / this.colorTransition.duration, 1);
        
        // End transition when complete
        if (this.colorTransition.progress >= 1) {
            this.colorTransition.isTransitioning = false;
            this.colorTransition.fromScheme = null;
            this.colorTransition.toScheme = null;
        }
    }
    
    /**
     * Get rainbow color for a star
     * @param {Object} star - Star object
     * @param {number} currentTime - Current timestamp
     * @returns {Object} RGB color object
     */
    getRainbowColor(star, currentTime) {
        // Create rainbow colors based on star position and time for dynamic effect
        const hue = ((star.x + star.y) * 0.01 + currentTime * 0.001) % 360;
        return this.hslToRgb(hue, 70, 80);
    }
    
    /**
     * Get nebula color for a star (purple/pink/blue mix)
     * @param {Object} star - Star object
     * @param {number} currentTime - Current timestamp
     * @returns {Object} RGB color object
     */
    getNebulaColor(star, currentTime) {
        // Create nebula-like colors with purple, pink, and blue tones
        const baseHue = 270; // Purple base
        const hueVariation = Math.sin((star.x + star.y) * 0.005 + currentTime * 0.0005) * 60;
        const hue = (baseHue + hueVariation) % 360;
        
        // Higher saturation for more vivid nebula colors
        const saturation = 60 + Math.sin((star.x - star.y) * 0.003) * 20;
        const lightness = 60 + Math.sin(star.z * 0.01 + currentTime * 0.0003) * 15;
        
        return this.hslToRgb(hue, saturation, lightness);
    }
    
    /**
     * Get color for a specific scheme (used for transitions)
     * @param {string} schemeName - Color scheme name
     * @param {Object} star - Star object
     * @param {number} currentTime - Current timestamp
     * @returns {Object} RGB color object
     */
    getSchemeColor(schemeName, star, currentTime) {
        if (schemeName === 'rainbow') {
            return this.getRainbowColor(star, currentTime);
        } else if (schemeName === 'nebula') {
            return this.getNebulaColor(star, currentTime);
        } else {
            const scheme = this.colorSchemes[schemeName] || this.colorSchemes.white;
            return { r: scheme.r, g: scheme.g, b: scheme.b };
        }
    }
    
    /**
     * Blend two colors based on progress (0-1)
     * @param {Object} color1 - First color (RGB)
     * @param {Object} color2 - Second color (RGB)
     * @param {number} progress - Blend progress (0-1)
     * @returns {Object} Blended RGB color
     */
    blendColors(color1, color2, progress) {
        // Smooth easing function for better transition feel
        const easedProgress = this.easeInOutCubic(progress);
        
        return {
            r: Math.round(color1.r + (color2.r - color1.r) * easedProgress),
            g: Math.round(color1.g + (color2.g - color1.g) * easedProgress),
            b: Math.round(color1.b + (color2.b - color1.b) * easedProgress)
        };
    }
    
    /**
     * Apply brightness and ensure proper contrast against black background
     * @param {Object} baseColor - Base RGB color
     * @param {number} brightness - Brightness factor (0-1)
     * @returns {Object} Final RGB color with proper contrast
     */
    applyBrightnessAndContrast(baseColor, brightness) {
        // Apply brightness
        let r = Math.floor(baseColor.r * brightness);
        let g = Math.floor(baseColor.g * brightness);
        let b = Math.floor(baseColor.b * brightness);
        
        // Ensure minimum brightness for visibility against black background
        const minBrightness = 30; // Minimum RGB value for visibility
        r = Math.max(minBrightness, r);
        g = Math.max(minBrightness, g);
        b = Math.max(minBrightness, b);
        
        // Enhance contrast for very dim stars
        if (brightness < 0.3) {
            const contrastBoost = 1.2;
            r = Math.min(255, Math.floor(r * contrastBoost));
            g = Math.min(255, Math.floor(g * contrastBoost));
            b = Math.min(255, Math.floor(b * contrastBoost));
        }
        
        return { r, g, b };
    }
    
    /**
     * Cubic easing function for smooth transitions
     * @param {number} t - Progress (0-1)
     * @returns {number} Eased progress (0-1)
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    /**
     * Draw enhanced glow effect around bright stars using canvas shadow properties
     * @param {number} x - Screen X coordinate
     * @param {number} y - Screen Y coordinate
     * @param {number} size - Star size
     * @param {Object} color - Star color
     * @param {number} brightness - Star brightness
     */
    drawGlow(x, y, size, color, brightness) {
        // Save current context state
        this.ctx.save();
        
        const glowSize = size + this.config.glowRadius * brightness;
        const glowAlpha = brightness * 0.4;
        
        // Method 1: Enhanced radial gradient glow
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, glowSize * 1.5);
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${glowAlpha})`);
        gradient.addColorStop(0.4, `rgba(${color.r}, ${color.g}, ${color.b}, ${glowAlpha * 0.6})`);
        gradient.addColorStop(0.8, `rgba(${color.r}, ${color.g}, ${color.b}, ${glowAlpha * 0.2})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, glowSize * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Method 2: Canvas shadow-based glow for very bright stars
        if (brightness > 0.6) {
            this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${brightness * 0.8})`;
            this.ctx.shadowBlur = glowSize * 2;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // Draw multiple shadow layers for intense glow
            for (let i = 0; i < 3; i++) {
                this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${brightness * 0.1})`;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Reset shadow properties
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }
        
        // Method 3: Additional outer glow ring for very close stars
        if (brightness > 0.8) {
            const outerGlowSize = glowSize * 2;
            const outerGradient = this.ctx.createRadialGradient(x, y, glowSize, x, y, outerGlowSize);
            outerGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${brightness * 0.1})`);
            outerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.fillStyle = outerGradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, outerGlowSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Restore context state
        this.ctx.restore();
    }
    
    /**
     * Draw the main star
     * @param {number} x - Screen X coordinate
     * @param {number} y - Screen Y coordinate
     * @param {number} size - Star size
     * @param {Object} color - Star color
     * @param {number} brightness - Star brightness
     */
    drawStar(x, y, size, color, brightness) {
        const alpha = Math.max(0.1, brightness);
        
        this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add bright center for larger stars
        if (size > 3 && brightness > 0.5) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.8})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size / 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * Draw trail effect from previous position
     * @param {Object} star - Star object with previous position
     * @param {Object} screenPos - Current screen position
     * @param {Object} color - Star color
     * @param {number} brightness - Star brightness
     */
    drawTrail(star, screenPos, color, brightness) {
        // This is a simplified trail - in a full implementation,
        // we would need the camera to project the previous position
        // For now, we'll create a subtle trail effect
        const trailAlpha = brightness * 0.2;
        
        if (trailAlpha > 0.05) {
            this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${trailAlpha})`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(screenPos.x, screenPos.y);
            // Simple trail approximation - move slightly back
            this.ctx.lineTo(screenPos.x + 2, screenPos.y + 1);
            this.ctx.stroke();
        }
    }
    
    /**
     * Convert HSL color to RGB
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} l - Lightness (0-100)
     * @returns {Object} RGB color object
     */
    hslToRgb(h, s, l) {
        h = h / 360;
        s = s / 100;
        l = l / 100;
        
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        return {
            r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
            g: Math.round(hue2rgb(p, q, h) * 255),
            b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
        };
    }
    
    /**
     * Update renderer configuration
     * @param {Object} newConfig - Configuration updates
     */
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
    }
    
    /**
     * Set color scheme with smooth transition
     * @param {string} scheme - Color scheme name
     * @param {boolean} smooth - Whether to use smooth transition (default: true)
     */
    setColorScheme(scheme, smooth = true) {
        if (!this.colorSchemes.hasOwnProperty(scheme)) {
            console.warn(`Unknown color scheme: ${scheme}`);
            return;
        }
        
        if (scheme === this.config.colorScheme) {
            return; // No change needed
        }
        
        if (smooth && !this.colorTransition.isTransitioning) {
            // Start smooth transition
            this.colorTransition.isTransitioning = true;
            this.colorTransition.startTime = performance.now();
            this.colorTransition.fromScheme = this.config.colorScheme;
            this.colorTransition.toScheme = scheme;
            this.colorTransition.progress = 0;
        }
        
        this.config.colorScheme = scheme;
    }
    
    /**
     * Get available color schemes with metadata
     * @returns {Object} Color schemes with their properties
     */
    getColorSchemes() {
        return Object.keys(this.colorSchemes).map(key => ({
            id: key,
            name: this.colorSchemes[key].name || key,
            description: this.colorSchemes[key].description || '',
            dynamic: this.colorSchemes[key].dynamic || false
        }));
    }
    
    /**
     * Enable or disable trail effects
     * @param {boolean} enabled - Whether trails should be enabled
     */
    setTrailsEnabled(enabled) {
        this.config.enableTrails = enabled;
    }
    
    /**
     * Enable or disable glow effects
     * @param {boolean} enabled - Whether glow should be enabled
     */
    setGlowEnabled(enabled) {
        this.config.enableGlow = enabled;
    }
    
    /**
     * Set base star size
     * @param {number} size - Base star size multiplier
     */
    setBaseStarSize(size) {
        this.config.baseStarSize = Math.max(0.5, Math.min(5, size));
    }
    
    /**
     * Get current renderer configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    
    /**
     * Resize renderer for new canvas dimensions
     * @param {number} width - New canvas width
     * @param {number} height - New canvas height
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
    
    /**
     * Get debug information about the renderer
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            config: this.getConfig(),
            canvas: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            colorSchemes: Object.keys(this.colorSchemes)
        };
    }
}

// Export for use in other modules (if using modules) or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
} else {
    window.Renderer = Renderer;
}