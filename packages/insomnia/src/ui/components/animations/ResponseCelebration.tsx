/**
 * ResponseCelebration Component
 * 
 * Displays whimsical animated emoji particles based on HTTP response status codes.
 * 
 * Visual Philosophy: Fleeting, whimsical, and nonintrusive to the workspace.
 * Charm balanced with professionalism.
 * 
 * Behavior:
 * - Animations trigger automatically when response arrives with eligible status code (2xx/4xx/5xx)
 * - Particles continue spawning until user moves mouse in active window
 * - On mouse movement: Stop spawning, fade existing particles over 2 seconds
 * - All particles start OFF-SCREEN and move into view (no sudden pop-in)
 * 
 * Animation Types:
 * - 2xx Success: Balloons float UPWARD, confetti falls DOWNWARD
 * - 4xx Client Error: Confused emojis SPIRAL downward
 * - 5xx Server Error: Frustrated emojis fall STRAIGHT down
 * 
 * Performance:
 * - 60 FPS target using GPU-accelerated CSS transforms
 * - Maximum 25 particles (2xx animations)
 * - <5% CPU usage, <5MB memory overhead
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { RESPONSE_CELEBRATION_EMOJIS } from '../../../common/constants';
import {
  type AnimationState,
  type AnimationType,
  type ParticleDefinition,
  type StatusCodeRange,
  calculateAnimationDuration,
  calculateEmojiSize,
  generateSpawnDelay,
  getStatusCodeRange,
} from '../../hooks/use-response-animation';

// =============================================================================
// CSS KEYFRAME ANIMATIONS
// =============================================================================

/**
 * Balloon Float Up - rises from bottom to top with gentle drift
 * (Note: Currently not used in MVP - all particles fall down)
 */
const balloonFloatUp = keyframes`
  from {
    transform: translateY(0) translateX(0);
    opacity: 1;
  }
  to {
    transform: translateY(var(--travel-distance)) translateX(var(--drift-x));
    opacity: 1;
  }
`;

/**
 * Confetti Fall Down - falls from top to bottom with rotation
 * Used for all 2xx success animations
 */
const confettiFallDown = keyframes`
  from {
    transform: translateY(0) translateX(0) rotate(0deg);
    opacity: 1;
  }
  to {
    transform: translateY(var(--travel-distance)) translateX(var(--drift-x)) rotate(var(--rotation));
    opacity: 1;
  }
`;

/**
 * Spiral Down - spirals downward in circular pattern
 * Used for 4xx client error animations
 */
const spiralDown = keyframes`
  from {
    transform: translateY(0) translateX(0) rotate(0deg);
    opacity: 1;
  }
  to {
    transform: translateY(var(--travel-distance)) translateX(var(--drift-x)) rotate(360deg);
    opacity: 1;
  }
`;

/**
 * Straight Fall - falls straight down, no drift
 * Used for 5xx server error animations
 */
const straightFall = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(var(--travel-distance));
    opacity: 1;
  }
`;

/**
 * Fade Out - triggered by mouse click
 * Gracefully fades particles over 2 seconds
 */
const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Props for the ResponseCelebration component.
 */
export interface ResponseCelebrationProps {
  /**
   * HTTP status code from the API response.
   * Only codes in ranges 200-299, 400-499, 500-599 will trigger animations.
   */
  statusCode: number;

  /**
   * Whether animations are enabled in user settings.
   * If false, component renders nothing.
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback fired when animation session ends (after fade-out completes).
   */
  onAnimationComplete?: (statusCodeRange: StatusCodeRange) => void;
}

// =============================================================================
// STYLED COMPONENTS
// =============================================================================

/**
 * Overlay container for all animation particles.
 * 
 * - Positioned absolutely to cover the response pane
 * - pointer-events: auto to detect mouse clicks for dismissal
 * - overflow: hidden to clip particles at edges
 * - Transparent background so content below is visible
 */
const AnimationOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: auto; /* Allow mouse events for dismissal detection */
  overflow: hidden;
  z-index: 1000;
  background: transparent;
  
  /* Show pointer cursor to indicate clickability */
  cursor: pointer;
`;

/**
 * Individual emoji particle element.
 * 
 * - Absolutely positioned for precise control
 * - will-change hint for GPU acceleration
 * - CSS variables control animation parameters
 */
const Particle = styled.span<{
  $startX: number;
  $startY: number;
  $endX: number;
  $endY: number;
  $size: number;
  $duration: number;
  $delay: number;
  $animationType: string;
  $driftX?: number;
  $rotation?: number;
  $isFading: boolean;
}>`
  position: absolute;
  /* Initial position (where particle starts) */
  left: ${props => props.$startX}px;
  top: ${props => props.$startY}px;
  font-size: ${props => props.$size}px;
  will-change: transform, opacity;
  pointer-events: none;
  user-select: none;
  
  /* Set CSS variables for animation control */
  --drift-x: ${props => props.$driftX ?? 0}px;
  --rotation: ${props => props.$rotation ?? 0}deg;
  --travel-distance: ${props => props.$endY - props.$startY}px;
  --animation-duration: ${props => props.$duration}ms;
  
  /* Apply animation based on type - reference the keyframe constants */
  animation-name: ${props => {
    // Map animation type string to keyframe constant
    switch (props.$animationType) {
      case 'balloonUp':
        return balloonFloatUp;
      case 'confettiDown':
        return confettiFallDown;
      case 'spiralDown':
        return spiralDown;
      case 'straightFall':
        return straightFall;
      default:
        return confettiFallDown;
    }
  }};
  animation-duration: var(--animation-duration);
  animation-timing-function: linear;
  animation-delay: ${props => props.$delay}ms;
  animation-fill-mode: forwards;
  
  /* Fade-out override when mouse moves - uses css helper for keyframe interpolation */
  ${props => props.$isFading && css`
    animation: ${fadeOut} 2s linear forwards !important;
  `}
`;

/**
 * Screen reader announcement region (visually hidden).
 * Announces status category to screen readers without visual interference.
 */
const ScreenReaderAnnouncement = styled.div`
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
`;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ResponseCelebration - Main animation orchestrator component
 */
export const ResponseCelebration: React.FC<ResponseCelebrationProps> = React.memo(({
  statusCode,
  enabled = true,
  onAnimationComplete,
}) => {
  console.log('[ResponseCelebration] Component rendered with statusCode:', statusCode, 'enabled:', enabled);
  
  // Early return if animations disabled
  if (!enabled) {
    console.log('[ResponseCelebration] Animations disabled in settings');
    return null;
  }

  // Check for OS-level reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    console.log('[ResponseCelebration] Reduced motion preference detected');
    return null;
  }

  // Categorize status code
  const statusCodeRange = useMemo(() => {
    const range = getStatusCodeRange(statusCode);
    console.log('[ResponseCelebration] Status code', statusCode, 'categorized as:', range);
    return range;
  }, [statusCode]);

  // No animation for 1xx, 3xx, or invalid codes
  if (!statusCodeRange) {
    return null;
  }

  // Calculate viewport-dependent values (memoized for performance)
  const viewportHeight = useMemo(() => window.innerHeight, []);
  const viewportWidth = useMemo(() => window.innerWidth, []);
  const emojiSize = useMemo(
    () => calculateEmojiSize(viewportHeight, viewportWidth),
    [viewportHeight, viewportWidth]
  );
  const animationDuration = useMemo(
    () => calculateAnimationDuration(viewportHeight),
    [viewportHeight]
  );

  // Animation state
  const [animationState, setAnimationState] = useState<AnimationState>({
    isActive: false,
    statusCodeRange: null,
    particles: [],
    mouseMovedAt: null,
    spawnIntervalId: null,
  });

  // Screen reader announcement message
  const screenReaderMessage = useMemo(() => {
    switch (statusCodeRange) {
      case '2xx':
        return 'Request succeeded';
      case '4xx':
        return 'Client error';
      case '5xx':
        return 'Server error';
      default:
        return '';
    }
  }, [statusCodeRange]);

  // =============================================================================
  // T013: PARTICLE SPAWNING LOGIC (2XX SUCCESS)
  // =============================================================================
  
  /**
   * Generates a single particle with appropriate properties for the status code range.
   * 
   * For 2xx SUCCESS:
   * - Balloons: Float upward from bottom (startY: 105vh → endY: -5vh)
   * - Confetti: Fall downward from top (startY: -5vh → endY: 105vh)
   */
  const generateParticle = useCallback((
    range: StatusCodeRange
  ): ParticleDefinition => {
    const id = `particle-${Date.now()}-${Math.random()}`;
    const delay = generateSpawnDelay(0, 500);
    
    // Random horizontal starting position across viewport
    const startX = Math.random() * viewportWidth;
    
    if (range === '2xx') {
      // All success emojis fall DOWNWARD with randomized patterns
      // Combine all success emojis (balloons + confetti) into one pool
      const allSuccessEmojis = [
        ...RESPONSE_CELEBRATION_EMOJIS.SUCCESS.balloons,
        ...RESPONSE_CELEBRATION_EMOJIS.SUCCESS.confetti,
      ];
      
      // Pick random emoji from the full set
      const emoji = allSuccessEmojis[Math.floor(Math.random() * allSuccessEmojis.length)];
      
      // All particles fall from top to bottom
      const startY = -(viewportHeight * 0.05); // -5vh (off-screen above)
      const endY = viewportHeight * 1.05; // 105vh (off-screen below)
      
      // Randomized horizontal drift (±10% to ±30% viewport width for variety)
      const driftAmount = (Math.random() * 0.20 + 0.10) * viewportWidth; // 10% to 30%
      const driftDirection = Math.random() < 0.5 ? -1 : 1; // Left or right
      const driftX = driftAmount * driftDirection;
      
      // Vary the animation duration slightly for more organic feel (±20%)
      const durationVariation = (Math.random() * 0.4 - 0.2) + 1; // 0.8 to 1.2
      const variedDuration = animationDuration * durationVariation;
      
      return {
        id,
        emoji,
        startX,
        startY,
        endX: startX + driftX,
        endY,
        size: emojiSize,
        duration: variedDuration,
        delay,
        animationType: 'confettiDown',
        isFading: false,
      };
    }
    
    if (range === '4xx') {
      // Client error emojis spiral downward (confused, questioning)
      const emoji = RESPONSE_CELEBRATION_EMOJIS.CLIENT_ERROR[
        Math.floor(Math.random() * RESPONSE_CELEBRATION_EMOJIS.CLIENT_ERROR.length)
      ];
      
      const startY = -(viewportHeight * 0.05); // -5vh (off-screen above)
      const endY = viewportHeight * 1.05; // 105vh (off-screen below)
      
      // Spiral pattern - wider drift for spiral effect (±15% to ±25% viewport width)
      const driftAmount = (Math.random() * 0.10 + 0.15) * viewportWidth; // 15% to 25%
      const driftDirection = Math.random() < 0.5 ? -1 : 1;
      const driftX = driftAmount * driftDirection;
      
      // Slightly slower for contemplative feel
      const durationVariation = (Math.random() * 0.3 - 0.15) + 1.1; // 0.95 to 1.25
      const variedDuration = animationDuration * durationVariation;
      
      return {
        id,
        emoji,
        startX,
        startY,
        endX: startX + driftX,
        endY,
        size: emojiSize,
        duration: variedDuration,
        delay,
        animationType: 'spiralDown' as AnimationType,
        isFading: false,
      };
    }
    
    if (range === '5xx') {
      // Server error emojis fall straight down (angry, crying, frustrated)
      const emoji = RESPONSE_CELEBRATION_EMOJIS.SERVER_ERROR[
        Math.floor(Math.random() * RESPONSE_CELEBRATION_EMOJIS.SERVER_ERROR.length)
      ];
      
      const startY = -(viewportHeight * 0.05); // -5vh (off-screen above)
      const endY = viewportHeight * 1.05; // 105vh (off-screen below)
      
      // NO horizontal drift - fall straight down for "heavy" feel (endX = startX)
      
      // Slightly faster for urgency/frustration feel
      const durationVariation = (Math.random() * 0.2 - 0.1) + 0.9; // 0.8 to 1.0
      const variedDuration = animationDuration * durationVariation;
      
      return {
        id,
        emoji,
        startX,
        startY,
        endX: startX, // Same as startX - no drift
        endY,
        size: emojiSize,
        duration: variedDuration,
        delay,
        animationType: 'straightFall' as AnimationType,
        isFading: false,
      };
    }
    
    // Fallback (should never reach here)
    return {
      id,
      emoji: '❓',
      startX,
      startY: 0,
      endX: startX,
      endY: viewportHeight,
      size: emojiSize,
      duration: animationDuration,
      delay,
      animationType: 'straightFall' as AnimationType,
      isFading: false,
    };
  }, [viewportWidth, viewportHeight, emojiSize, animationDuration]);

  // =============================================================================
  // T014: PARTICLE SPAWN INTERVAL
  // =============================================================================
  
  /**
   * Start spawning particles when status code changes.
   * Spawns new particles every 40ms until:
   * - Maximum particle count reached (75 for 2xx)
   * - User clicks anywhere (mouseMovedAt is set)
   */
  useEffect(() => {
    // Only start if we have a valid status code range and not already active
    if (!statusCodeRange) {
      console.log('[ResponseCelebration] No valid status code range:', statusCodeRange);
      return;
    }
    
    console.log('[ResponseCelebration] Starting animations for:', statusCodeRange, 'statusCode:', statusCode);
    
    // Determine max particles for this range (increased 3x for more visual impact)
    const maxParticles = statusCodeRange === '2xx' ? 75 : 
                         statusCodeRange === '4xx' ? 45 : 54;
    
    // Initialize animation state
    setAnimationState(prev => ({
      ...prev,
      isActive: true,
      statusCodeRange,
      particles: [],
      mouseMovedAt: null,
      spawnIntervalId: null,
    }));
    
    let particleCount = 0;
    
    // Start spawning particles
    const intervalId = window.setInterval(() => {
      setAnimationState(prev => {
        // Stop spawning if mouse moved or max particles reached
        if (prev.mouseMovedAt !== null || particleCount >= maxParticles) {
          if (prev.spawnIntervalId !== null) {
            window.clearInterval(prev.spawnIntervalId);
          }
          return {
            ...prev,
            spawnIntervalId: null,
          };
        }
        
        // Generate new particle
        const newParticle = generateParticle(statusCodeRange);
        particleCount++;
        console.log('[ResponseCelebration] Spawning particle', particleCount, '/', maxParticles, newParticle);
        
        return {
          ...prev,
          particles: [...prev.particles, newParticle],
          spawnIntervalId: intervalId,
        };
      });
    }, 40); // Spawn every 40ms (faster spawn rate - ~25 particles per second)
    
    // Cleanup on unmount or status code change
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [statusCode, statusCodeRange, generateParticle]);

  // =============================================================================
  // T015: MOUSE CLICK DETECTION
  // =============================================================================
  
  /**
   * Detect mouse click in the application window.
   * On first click after animations start:
   * - Stop spawning new particles
   * - Trigger fade-out of existing particles
   */
  const handleClick = useCallback(() => {
    setAnimationState(prev => {
      // Only trigger on first mouse click
      if (prev.mouseMovedAt === null && prev.isActive) {
        console.log('[ResponseCelebration] Mouse clicked - triggering fade-out');
        return {
          ...prev,
          mouseMovedAt: Date.now(), // Keep same property name for backward compatibility
        };
      }
      return prev;
    });
  }, []);

  // =============================================================================
  // T016: FADE-OUT LOGIC (2-SECOND FADE)
  // =============================================================================
  
  /**
   * When user clicks, set isFading on all particles and clean up after 2 seconds.
   */
  useEffect(() => {
    if (animationState.mouseMovedAt !== null) { // Note: variable name unchanged for backward compatibility
      // Mark all particles as fading
      setAnimationState(prev => ({
        ...prev,
        particles: prev.particles.map(p => ({ ...p, isFading: true })),
      }));
      
      // Clear all particles after 2 seconds (fade-out duration)
      const fadeTimeout = window.setTimeout(() => {
        const completedRange = animationState.statusCodeRange;
        
        setAnimationState({
          isActive: false,
          statusCodeRange: null,
          particles: [],
          mouseMovedAt: null,
          spawnIntervalId: null,
        });
        
        // Notify parent that animation completed
        if (completedRange && onAnimationComplete) {
          onAnimationComplete(completedRange);
        }
      }, 2000);
      
      return () => {
        window.clearTimeout(fadeTimeout);
      };
    }
    // Return undefined if mouseMovedAt is null (no cleanup needed)
    return undefined;
  }, [animationState.mouseMovedAt, animationState.statusCodeRange, onAnimationComplete]);

  // Don't render overlay if there are no particles
  if (animationState.particles.length === 0 && !animationState.isActive) {
    console.log('[ResponseCelebration] Not rendering - no particles and not active');
    return null;
  }

  console.log('[ResponseCelebration] Rendering with', animationState.particles.length, 'particles');

  return (
    <AnimationOverlay onClick={handleClick}>
      {/* Screen reader announcement */}
      <ScreenReaderAnnouncement
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {animationState.isActive && screenReaderMessage}
      </ScreenReaderAnnouncement>

      {/* Particles rendered with all animation properties */}
      {animationState.particles.map(particle => {
        // Calculate drift (horizontal movement) from start to end position
        const driftX = particle.endX - particle.startX;
        // For confetti, add random rotation
        const rotation = particle.animationType === 'confettiDown' 
          ? Math.random() * 360 
          : particle.animationType === 'spiralDown' 
          ? 360 
          : 0;
        
        return (
          <Particle
            key={particle.id}
            $startX={particle.startX}
            $startY={particle.startY}
            $endX={particle.endX}
            $endY={particle.endY}
            $size={particle.size}
            $duration={particle.duration}
            $delay={particle.delay}
            $animationType={particle.animationType}
            $driftX={driftX}
            $rotation={rotation}
            $isFading={particle.isFading}
          >
            {particle.emoji}
          </Particle>
        );
      })}
    </AnimationOverlay>
  );
});

ResponseCelebration.displayName = 'ResponseCelebration';

