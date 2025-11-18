/**
 * TypeScript Interface Contracts: Response Code Celebration Animations
 * 
 * Phase: Phase 1 - Detailed Design
 * Date: 2025-11-14
 * 
 * These interfaces define the public API for the ResponseCelebration component
 * and related utilities. All interfaces are designed to be:
 * - Self-documenting (clear prop names)
 * - Type-safe (strict TypeScript)
 * - Simple (newcomer-friendly)
 */

// =============================================================================
// CORE TYPES
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

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Props for the main ResponseCelebration component.
 * 
 * This component is the top-level animation orchestrator.
 * It spawns particles, handles mouse movement detection, and manages cleanup.
 * 
 * @example
 * ```tsx
 * <ResponseCelebration
 *   statusCode={200}
 *   enabled={settings.enableResponseAnimations}
 *   onAnimationComplete={() => console.log('Animation session ended')}
 * />
 * ```
 */
export interface ResponseCelebrationProps {
  /**
   * HTTP status code from the API response.
   * Only codes in ranges 200-299, 400-499, 500-599 will trigger animations.
   * 
   * @example 200, 404, 500
   */
  statusCode: number;

  /**
   * Whether animations are enabled in user settings.
   * If false, component renders nothing.
   * 
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback fired when animation session ends.
   * Session ends when:
   * - Mouse movement detected AND 2-second fade-out completes
   * - New response arrives (cancels previous animation)
   * 
   * @param statusCodeRange - The range that was animating
   */
  onAnimationComplete?: (statusCodeRange: StatusCodeRange) => void;
}

// =============================================================================
// PARTICLE DEFINITIONS
// =============================================================================

/**
 * Defines an individual emoji particle's animation properties.
 * 
 * Each particle is an independent animated element with its own:
 * - Position trajectory (start → end)
 * - Timing (duration, delay)
 * - Appearance (emoji character, size)
 * - Animation type (movement pattern)
 * 
 * Particles are transient - created on response, destroyed after animation.
 */
export interface ParticleDefinition {
  /**
   * Unique identifier for React key prop.
   * Generated using `crypto.randomUUID()` or similar.
   * 
   * @example "a1b2c3d4-e5f6-4789-a012-345678901234"
   */
  id: string;

  /**
   * Single Unicode emoji character to display.
   * 
   * @example "🎈", "🎉", "🤔", "😭"
   */
  emoji: string;

  /**
   * Horizontal starting position in pixels from left edge of viewport.
   * Typically randomized within viewport width for visual variety.
   * 
   * @example 342 (for 1920px wide screen, random 0-1920)
   */
  startX: number;

  /**
   * Vertical starting position in pixels from top edge of viewport.
   * 
   * For animations starting from TOP (confetti, spiral, straight down):
   * - Use `-5vh` converted to pixels (off-screen above)
   * 
   * For animations starting from BOTTOM (balloons):
   * - Use `105vh` converted to pixels (off-screen below)
   * 
   * @example -54 (for 1080px tall screen, -5% = -54px off-screen)
   */
  startY: number;

  /**
   * Horizontal ending position in pixels from left edge of viewport.
   * 
   * May differ from startX to create drift or spiral effect:
   * - Balloons: startX ± 2% viewport width (gentle drift)
   * - Confetti: startX ± 5% viewport width (more drift)
   * - Spiral: Calculated sine wave offset (±15% viewport width)
   * - Straight: Same as startX (no horizontal movement)
   * 
   * @example 390 (drifted from startX=342 by 48px)
   */
  endX: number;

  /**
   * Vertical ending position in pixels from top edge of viewport.
   * Opposite edge from startY (particles traverse full screen height).
   * 
   * For animations ending at TOP (balloons):
   * - Use `-5vh` converted to pixels
   * 
   * For animations ending at BOTTOM (confetti, spiral, straight):
   * - Use `105vh` converted to pixels
   * 
   * @example 1134 (for 1080px tall screen, 105% = 1134px off-screen)
   */
  endY: number;

  /**
   * Font size in pixels for the emoji character.
   * 
   * Calculated as: `Math.min(viewportHeight, viewportWidth) * 0.05`
   * 
   * This ensures emojis are:
   * - Noticeable but not overwhelming
   * - Proportional to screen size
   * - Never exceed 5% of smaller viewport dimension
   * 
   * @example 54 (for 1080px tall screen, 5% = 54px)
   */
  size: number;

  /**
   * Animation duration in milliseconds.
   * 
   * Calculated to achieve approximately 4 inches per second movement:
   * `duration = (viewportHeight / 384) * 1000`
   * 
   * Where 384 = 4 inches/sec * 96 DPI
   * 
   * @example 2812 (for 1080px tall screen: 1080/384 * 1000 = 2812ms)
   */
  duration: number;

  /**
   * Spawn delay in milliseconds before particle starts animating.
   * 
   * Randomized (0-500ms) to create staggered appearance rather than
   * all particles spawning simultaneously.
   * 
   * @example 234 (random delay between 0-500ms)
   */
  delay: number;

  /**
   * Which CSS animation keyframe to apply.
   * Determines the movement pattern for this particle.
   * 
   * @see AnimationType for available patterns
   */
  animationType: AnimationType;

  /**
   * Whether this particle is currently fading out.
   * 
   * Set to `true` when mouse movement detected.
   * Triggers CSS class `.particle--fading` which applies 2-second fade-out.
   * 
   * @default false
   */
  isFading: boolean;
}

// =============================================================================
// ANIMATION STATE
// =============================================================================

/**
 * Tracks the current animation session state.
 * 
 * This is the primary state object managed by the ResponseCelebration component.
 * It orchestrates particle lifecycle from spawn through cleanup.
 */
export interface AnimationState {
  /**
   * Whether any animations are currently active.
   * 
   * `true` from response arrival until all particles cleaned up.
   * `false` when idle (no animations).
   */
  isActive: boolean;

  /**
   * Which status code range triggered this animation session.
   * 
   * Determines emoji set and particle count via STATUS_CODE_MAPPINGS.
   * Null when no animation active.
   * 
   * @example '2xx' for status 200, '4xx' for status 404
   */
  statusCodeRange: StatusCodeRange | null;

  /**
   * Array of currently animating particles.
   * 
   * Particles are:
   * - Added: When spawned (every 100-200ms until mouse moves)
   * - Updated: When `isFading` set to true on mouse movement
   * - Removed: After CSS animation completes or fade-out finishes
   * 
   * Maximum length: 25 (for 2xx animations)
   */
  particles: ParticleDefinition[];

  /**
   * Unix timestamp (milliseconds) when mouse first moved after animation started.
   * 
   * - `null`: Mouse hasn't moved yet (still spawning particles)
   * - `number`: Mouse moved at this timestamp (fade-out in progress)
   * 
   * Used to calculate when 2-second fade-out completes.
   * 
   * @example 1699901234567 (timestamp from Date.now())
   */
  mouseMovedAt: number | null;

  /**
   * setInterval timer ID for particle spawning.
   * 
   * - `null`: Not currently spawning (idle or fading out)
   * - `number`: Active spawn interval, cleared on mouse movement
   * 
   * Used to stop spawning new particles when mouse moves.
   */
  spawnIntervalId: number | null;
}

// =============================================================================
// EMOJI MAPPINGS
// =============================================================================

/**
 * Collection of emoji arrays categorized by purpose.
 * Different status code ranges use different emoji sets.
 */
export interface EmojiSet {
  /**
   * Balloon emojis (float upward in 2xx animations)
   * @example ['🎈']
   */
  balloons?: string[];

  /**
   * Confetti/celebration emojis (fall downward in 2xx animations)
   * @example ['🎉', '🎊', '✨', '🌟', '💫', '❤️', '💥']
   */
  confetti?: string[];

  /**
   * Confused/questioning emojis (spiral downward in 4xx animations)
   * @example ['🤔', '😕', '❓', '🤷', '😳', '👀', '🧐']
   */
  confused?: string[];

  /**
   * Frustrated/angry emojis (fall straight down in 5xx animations)
   * @example ['😭', '😤', '😡', '💢', '💔', '😩', '😫', '🔥']
   */
  frustrated?: string[];
}

/**
 * Maps status code range to emoji set, particle count, and animation types.
 * 
 * This is a static configuration object defined in `constants.ts`.
 * It provides all the information needed to generate animations for each range.
 */
export interface StatusCodeMapping {
  /**
   * Status code range identifier
   * @example '2xx', '4xx', '5xx'
   */
  range: StatusCodeRange;

  /**
   * Emojis to choose from when spawning particles for this range.
   * Randomly selected from appropriate category.
   */
  emojis: EmojiSet;

  /**
   * Total number of particles to spawn for this range.
   * 
   * - 2xx: 25 particles (most celebratory)
   * - 4xx: 15 particles (moderate confusion)
   * - 5xx: 18 particles (significant frustration)
   */
  particleCount: number;

  /**
   * Which animation types to use for this range.
   * 
   * - 2xx: ['balloonUp', 'confettiDown'] (mixed upward/downward)
   * - 4xx: ['spiralDown'] (confusion spiral)
   * - 5xx: ['straightDown'] (heavy downward fall)
   */
  animationTypes: AnimationType[];
}

// =============================================================================
// SETTINGS INTERFACE
// =============================================================================

/**
 * User preference settings for response animations.
 * 
 * Stored in Insomnia's existing settings system.
 * These fields are added to the existing Settings interface.
 */
export interface AnimationSettings {
  /**
   * Master toggle for all response code animations.
   * 
   * When `false`, ResponseCelebration component renders nothing.
   * User can disable via Settings > General > Appearance.
   * 
   * @default true
   */
  enableResponseAnimations: boolean;

  /**
   * Whether to honor OS-level "reduce motion" accessibility setting.
   * 
   * When `true` AND OS has reduce motion enabled:
   * - Animations completely disabled (respects accessibility)
   * 
   * When `false`:
   * - Animations play regardless of OS setting (not recommended)
   * 
   * @default true
   */
  respectReducedMotion: boolean;
}

// =============================================================================
// UTILITY FUNCTIONS (TYPE SIGNATURES)
// =============================================================================

/**
 * Categorizes an HTTP status code into animation range.
 * 
 * @param statusCode - HTTP status code (e.g., 200, 404, 500)
 * @returns Status code range or null if not eligible for animation
 * 
 * @example
 * ```typescript
 * getStatusCodeRange(200) // '2xx'
 * getStatusCodeRange(404) // '4xx'
 * getStatusCodeRange(302) // null (redirects don't animate)
 * ```
 */
export type GetStatusCodeRange = (statusCode: number) => StatusCodeRange | null;

/**
 * Calculates emoji size based on viewport dimensions.
 * Returns max 5% of smaller dimension to maintain aspect ratio.
 * 
 * @param viewportHeight - Window height in pixels
 * @param viewportWidth - Window width in pixels
 * @returns Font size in pixels
 * 
 * @example
 * ```typescript
 * calculateEmojiSize(1080, 1920) // 54 (5% of 1080)
 * calculateEmojiSize(1920, 1080) // 54 (5% of 1080, smaller dimension)
 * ```
 */
export type CalculateEmojiSize = (
  viewportHeight: number,
  viewportWidth: number
) => number;

/**
 * Calculates animation duration to achieve ~4 inches/sec movement speed.
 * 
 * Formula: (viewportHeight / 384) * 1000
 * Where 384 = 4 inches/sec * 96 DPI
 * 
 * @param viewportHeight - Window height in pixels
 * @returns Duration in milliseconds
 * 
 * @example
 * ```typescript
 * calculateAnimationDuration(1080) // 2812ms
 * calculateAnimationDuration(1920) // 5000ms
 * ```
 */
export type CalculateAnimationDuration = (viewportHeight: number) => number;

/**
 * Generates a random spawn delay for staggered particle appearance.
 * 
 * @param min - Minimum delay in ms (typically 0)
 * @param max - Maximum delay in ms (typically 500)
 * @returns Random delay in ms
 * 
 * @example
 * ```typescript
 * generateSpawnDelay(0, 500) // 234 (random between 0-500)
 * ```
 */
export type GenerateSpawnDelay = (min: number, max: number) => number;

