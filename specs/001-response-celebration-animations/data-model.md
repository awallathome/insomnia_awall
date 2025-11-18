# Data Model: Response Code Celebration Animations

**Date**: 2025-11-14  
**Phase**: Phase 1 - Detailed Design

## Overview

This feature requires minimal data persistence (only user preferences). Most data structures are transient animation state managed in React component memory.

## Entities

### 1. AnimationPreferences (Persisted)

**Purpose**: Store user settings for response animations

**Storage**: Existing settings system (`models/settings.ts`)

**Schema**:
```typescript
interface Settings {
  // ... existing fields
  
  enableResponseAnimations: boolean;  // Default: true
  respectReducedMotion: boolean;      // Default: true
}
```

**Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `enableResponseAnimations` | `boolean` | Yes | `true` | Master toggle for all response animations |
| `respectReducedMotion` | `boolean` | Yes | `true` | Whether to honor OS `prefers-reduced-motion` setting |

**Constraints**:
- No validation needed (boolean flags)
- Backward compatible: If missing, defaults to `true`

**State Transitions**: None (simple boolean toggles)

---

### 2. ParticleDefinition (Runtime/Transient)

**Purpose**: Define individual emoji particle properties for animation

**Storage**: Component state (React `useState`)

**Schema**:
```typescript
interface ParticleDefinition {
  id: string;                    // Unique identifier (UUID)
  emoji: string;                 // Single emoji character
  startX: number;                // Horizontal start position (px)
  startY: number;                // Vertical start position (px, off-screen)
  endX: number;                  // Horizontal end position (px)
  endY: number;                  // Vertical end position (px, off-screen)
  size: number;                  // Font size (px), max 5% viewport
  duration: number;              // Animation duration (ms), calculated from viewport height
  delay: number;                 // Spawn delay (ms), 0-500 random
  animationType: AnimationType;  // 'balloonUp' | 'confettiDown' | 'spiralDown' | 'straightDown'
  isFading: boolean;             // Whether fade-out is active
}
```

**Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for React key prop |
| `emoji` | `string` | Yes | Unicode emoji character (e.g., '🎈') |
| `startX` | `number` | Yes | Horizontal position in pixels from left edge |
| `startY` | `number` | Yes | Vertical position in pixels, typically -5vh (off-screen above) or 105vh (off-screen below) |
| `endX` | `number` | Yes | Horizontal end position (may differ from startX for drift/spiral) |
| `endY` | `number` | Yes | Vertical end position (opposite edge from startY) |
| `size` | `number` | Yes | Font size in pixels, calculated as `min(viewportHeight, viewportWidth) * 0.05` |
| `duration` | `number` | Yes | Animation duration in ms, calculated as `(viewportHeight / 384) * 1000` for 4"/sec |
| `delay` | `number` | Yes | Spawn delay in ms (0-500 random for staggered appearance) |
| `animationType` | `AnimationType` | Yes | Determines CSS keyframe animation to apply |
| `isFading` | `boolean` | Yes | True when mouse movement detected, triggers 2-second fade-out |

**Lifecycle**: 
1. **Created**: When response arrives with animation-eligible status code
2. **Updated**: `isFading` set to `true` on mouse movement
3. **Destroyed**: After fade-out completes (2 seconds) or particle completes full animation

**Volume**: Maximum 25 particles active simultaneously (2xx success animations)

---

### 3. AnimationState (Runtime/Transient)

**Purpose**: Track overall animation session state

**Storage**: Component state (React `useState`)

**Schema**:
```typescript
interface AnimationState {
  isActive: boolean;                  // Whether animations are currently running
  statusCodeRange: StatusCodeRange;   // '2xx' | '4xx' | '5xx'
  particles: ParticleDefinition[];    // Array of active particles
  mouseMovedAt: number | null;        // Timestamp when mouse moved (null if not moved)
  spawnIntervalId: number | null;     // setInterval ID for particle spawning
}
```

**Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isActive` | `boolean` | Yes | True from response arrival until all particles cleaned up |
| `statusCodeRange` | `StatusCodeRange` | Yes | Categorizes status code: '2xx', '4xx', or '5xx' |
| `particles` | `ParticleDefinition[]` | Yes | Array of currently animating particles |
| `mouseMovedAt` | `number \| null` | Yes | Unix timestamp (ms) when mouse first moved, or null |
| `spawnIntervalId` | `number \| null` | Yes | `setInterval` ID for cleanup, null when not spawning |

**State Transitions**:
```
IDLE (isActive: false)
  ↓ [Response arrives]
SPAWNING (isActive: true, mouseMovedAt: null)
  ↓ [Mouse moves]
FADING (isActive: true, mouseMovedAt: timestamp)
  ↓ [2 seconds elapsed + all particles removed]
IDLE (isActive: false)
```

---

### 4. StatusCodeMapping (Static/Constant)

**Purpose**: Map status code ranges to emoji sets and particle counts

**Storage**: Constants file (`common/constants.ts`)

**Schema**:
```typescript
interface StatusCodeMapping {
  range: StatusCodeRange;          // '2xx' | '4xx' | '5xx'
  emojis: EmojiSet;                // Separate arrays for balloons, confetti, etc.
  particleCount: number;           // Total particles to spawn
  animationTypes: AnimationType[]; // Which animation types to use
}

interface EmojiSet {
  balloons?: string[];   // For 2xx only
  confetti?: string[];   // For 2xx only
  confused?: string[];   // For 4xx only
  frustrated?: string[]; // For 5xx only
}
```

**Constant Values**:
```typescript
export const STATUS_CODE_MAPPINGS: Record<StatusCodeRange, StatusCodeMapping> = {
  '2xx': {
    range: '2xx',
    emojis: {
      balloons: ['🎈'],
      confetti: ['🎉', '🎊', '✨', '🌟', '💫', '❤️', '💥'],
    },
    particleCount: 25,
    animationTypes: ['balloonUp', 'confettiDown'],
  },
  '4xx': {
    range: '4xx',
    emojis: {
      confused: ['🤔', '😕', '❓', '🤷', '😳', '👀', '🧐'],
    },
    particleCount: 15,
    animationTypes: ['spiralDown'],
  },
  '5xx': {
    range: '5xx',
    emojis: {
      frustrated: ['😭', '😤', '😡', '💢', '💔', '😩', '😫', '🔥'],
    },
    particleCount: 18,
    animationTypes: ['straightDown'],
  },
};
```

---

## Type Definitions

### AnimationType

```typescript
type AnimationType = 
  | 'balloonUp'      // Float upward from bottom (2xx)
  | 'confettiDown'   // Fall downward from top (2xx)
  | 'spiralDown'     // Spiral downward from top (4xx)
  | 'straightDown';  // Fall straight down from top (5xx)
```

### StatusCodeRange

```typescript
type StatusCodeRange = '2xx' | '4xx' | '5xx';

// Utility function to categorize
function getStatusCodeRange(statusCode: number): StatusCodeRange | null {
  if (statusCode >= 200 && statusCode < 300) return '2xx';
  if (statusCode >= 400 && statusCode < 500) return '4xx';
  if (statusCode >= 500 && statusCode < 600) return '5xx';
  return null; // No animation for 1xx, 3xx
}
```

---

## Data Flow

### 1. Response Arrives

```
User sends request
  ↓
Response with statusCode arrives
  ↓
getStatusCodeRange(statusCode) → '2xx' | '4xx' | '5xx' | null
  ↓ (if not null)
STATUS_CODE_MAPPINGS[range] → mapping
  ↓
AnimationState.isActive = true
AnimationState.statusCodeRange = range
  ↓
Start spawning particles every 100-200ms
```

### 2. Particle Spawn

```
setInterval callback fires
  ↓
Generate ParticleDefinition:
  - Random emoji from mapping.emojis
  - Calculate size (5% viewport)
  - Calculate duration (viewport height / 384px/sec)
  - Random startX, appropriate animationType
  ↓
AnimationState.particles.push(particle)
  ↓
React renders new particle with CSS animation
```

### 3. Mouse Movement Detected

```
onMouseMove event fires
  ↓
If AnimationState.mouseMovedAt === null:
  ↓
  Set AnimationState.mouseMovedAt = Date.now()
  Clear spawn interval (stop new particles)
  ↓
  For each particle in AnimationState.particles:
    particle.isFading = true (triggers CSS fade)
  ↓
  setTimeout(2000ms):
    AnimationState.particles = []
    AnimationState.isActive = false
```

---

## Persistence Strategy

**No Database Required**: All data is transient (component state) or user preferences (existing settings system).

**Settings Persistence**: Existing Insomnia settings mechanism handles `enableResponseAnimations` flag:
- Stored in: `~/.config/Insomnia/settings.json` (or OS-appropriate location)
- Loaded on app startup
- Updated immediately on settings change

---

## Validation Rules

### AnimationPreferences

- No validation needed (boolean flags cannot be invalid)

### ParticleDefinition

```typescript
// Size constraint
assert(particle.size <= Math.min(viewportHeight, viewportWidth) * 0.05);

// Duration constraint (reasonable bounds)
assert(particle.duration >= 1000 && particle.duration <= 10000);

// Delay constraint
assert(particle.delay >= 0 && particle.delay <= 500);
```

---

## Performance Considerations

**Memory Usage**:
- Maximum 25 ParticleDefinition objects × ~200 bytes = ~5KB
- CSS animation state: ~1-2MB (browser-managed)
- **Total**: < 5MB ✅

**Cleanup Strategy**:
- Remove particles from array immediately after CSS animation completes
- Use `onAnimationEnd` callback to trigger cleanup
- Clear interval when mouse moves (stop spawning)

---

## Constitution Compliance

✅ **I. Simplicity**: Simple data structures, no complex relationships  
✅ **II. Documentation**: Each field documented with purpose and constraints  
✅ **III. File Organization**: All data models in one document, constants in one file (`constants.ts`)

