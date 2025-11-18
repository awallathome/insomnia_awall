/**
 * Response Animation Hook - Utilities and Types
 * 
 * Provides type definitions and utility functions for the ResponseCelebration component.
 * Handles viewport calculations, emoji sizing, animation duration, and status code categorization.
 * 
 * Design Philosophy: Fleeting, whimsical, and nonintrusive to the workspace.
 * Charm balanced with professionalism.
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * HTTP status code ranges that trigger animations.
 * Only 2xx (success), 4xx (client error), and 5xx (server error) are supported.
 * 
 * 1xx (informational) and 3xx (redirect) intentionally excluded to avoid visual noise.
 */
export type StatusCodeRange = '2xx' | '4xx' | '5xx';

/**
 * Animation movement patterns for emoji particles.
 * Each type corresponds to a specific CSS @keyframes animation.
 */
export type AnimationType = 
  | 'balloonUp'      // Floats upward from bottom (used for 2xx balloons)
  | 'confettiDown'   // Falls downward from top (used for 2xx confetti)
  | 'spiralDown'     // Spirals downward in circular pattern (used for 4xx)
  | 'straightDown';  // Falls straight down, no drift (used for 5xx)

/**
 * Defines an individual emoji particle's animation properties.
 * 
 * Each particle is an independent animated element with its own:
 * - Position trajectory (start → end)
 * - Timing (duration, delay)
 * - Appearance (emoji character, size)
 * - Animation type (movement pattern)
 */
export interface ParticleDefinition {
  /** Unique identifier for React key prop */
  id: string;
  
  /** Single Unicode emoji character to display */
  emoji: string;
  
  /** Horizontal starting position in pixels from left edge of viewport */
  startX: number;
  
  /** Vertical starting position in pixels from top edge of viewport (off-screen) */
  startY: number;
  
  /** Horizontal ending position in pixels (may include drift) */
  endX: number;
  
  /** Vertical ending position in pixels (opposite edge from startY) */
  endY: number;
  
  /** Font size in pixels for the emoji character (max 5% viewport) */
  size: number;
  
  /** Animation duration in milliseconds (calculated for ~4 inches/sec) */
  duration: number;
  
  /** Spawn delay in milliseconds (0-500ms for staggered appearance) */
  delay: number;
  
  /** Which CSS animation keyframe to apply */
  animationType: AnimationType;
  
  /** Whether this particle is currently fading out (triggered by mouse movement) */
  isFading: boolean;
}

/**
 * Tracks the current animation session state.
 * 
 * This is the primary state object managed by the ResponseCelebration component.
 * It orchestrates particle lifecycle from spawn through cleanup.
 */
export interface AnimationState {
  /** Whether any animations are currently active */
  isActive: boolean;
  
  /** Which status code range triggered this animation session (null when idle) */
  statusCodeRange: StatusCodeRange | null;
  
  /** Array of currently animating particles (max 25 for 2xx) */
  particles: ParticleDefinition[];
  
  /** Unix timestamp (ms) when mouse first moved after animation started (null if not moved) */
  mouseMovedAt: number | null;
  
  /** setInterval timer ID for particle spawning (null when not spawning) */
  spawnIntervalId: number | null;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Categorizes an HTTP status code into animation range.
 * 
 * @param statusCode - HTTP status code (e.g., 200, 404, 500)
 * @returns Status code range or null if not eligible for animation
 * 
 * @example
 * getStatusCodeRange(200) // '2xx'
 * getStatusCodeRange(404) // '4xx'
 * getStatusCodeRange(302) // null (redirects don't animate)
 */
export function getStatusCodeRange(statusCode: number): StatusCodeRange | null {
  if (statusCode >= 200 && statusCode < 300) {
    return '2xx';
  }
  if (statusCode >= 400 && statusCode < 500) {
    return '4xx';
  }
  if (statusCode >= 500 && statusCode < 600) {
    return '5xx';
  }
  return null; // No animation for 1xx (informational) or 3xx (redirect)
}

/**
 * Calculates emoji size based on viewport dimensions.
 * Returns max 5% of smaller dimension to maintain aspect ratio.
 * 
 * Design constraint: Emojis should be noticeable but not overwhelming.
 * 5% strikes a balance between visibility and subtlety.
 * 
 * @param viewportHeight - Window height in pixels
 * @param viewportWidth - Window width in pixels
 * @returns Font size in pixels
 * 
 * @example
 * calculateEmojiSize(1080, 1920) // 54 (5% of 1080, the smaller dimension)
 * calculateEmojiSize(1920, 1080) // 54 (5% of 1080, the smaller dimension)
 */
export function calculateEmojiSize(viewportHeight: number, viewportWidth: number): number {
  const smallerDimension = Math.min(viewportHeight, viewportWidth);
  return smallerDimension * 0.05; // 5% of smaller viewport dimension
}

/**
 * Calculates animation duration to achieve ~4 inches/sec movement speed.
 * 
 * Formula: (viewportHeight / 384) * 1000
 * Where 384 = 4 inches/sec * 96 DPI (standard web DPI)
 * 
 * This ensures animations move at a consistent perceived speed across different
 * screen sizes while remaining noticeable but not jarring.
 * 
 * @param viewportHeight - Window height in pixels
 * @returns Duration in milliseconds
 * 
 * @example
 * calculateAnimationDuration(1080) // 2812ms (~2.8 seconds for full screen traversal)
 * calculateAnimationDuration(1920) // 5000ms (5 seconds for full screen traversal)
 */
export function calculateAnimationDuration(viewportHeight: number): number {
  const DPI = 96; // Standard web DPI
  const SPEED_INCHES_PER_SEC = 4; // 4 inches per second movement speed
  const SPEED_PX_PER_SEC = SPEED_INCHES_PER_SEC * DPI; // 384 pixels per second
  
  return (viewportHeight / SPEED_PX_PER_SEC) * 1000; // milliseconds
}

/**
 * Generates a random spawn delay for staggered particle appearance.
 * 
 * Staggering prevents all particles from appearing simultaneously, creating
 * a more organic, flowing animation effect.
 * 
 * @param min - Minimum delay in ms (typically 0)
 * @param max - Maximum delay in ms (typically 500)
 * @returns Random delay in ms
 * 
 * @example
 * generateSpawnDelay(0, 500) // 234 (random between 0-500)
 */
export function generateSpawnDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

