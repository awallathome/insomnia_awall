---
description: "Task list for Response Code Celebration Animations"
---

# Tasks: Response Code Celebration Animations

**Input**: Design documents from `/specs/001-response-celebration-animations/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are NOT explicitly requested in the feature specification. Tasks below focus on implementation only. Manual testing will use quickstart.md guide.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `packages/insomnia/src/` for source code
- **Tests**: `packages/insomnia/tests/` for test files
- Paths shown below use absolute paths from repo root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and directory structure

- [ ] T001 Create animations directory in packages/insomnia/src/ui/components/animations/
- [ ] T002 Create hooks directory if not exists in packages/insomnia/src/ui/hooks/ (may already exist)
- [ ] T003 [P] Verify TypeScript compilation is working with `npm run type-check`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Add emoji constants to packages/insomnia/src/common/constants.ts:
  ```typescript
  export const RESPONSE_CELEBRATION_EMOJIS = {
    SUCCESS: {
      balloons: ['🎈'],
      confetti: ['🎉', '🎊', '✨', '🌟', '💫', '❤️', '💥'],
    },
    CLIENT_ERROR: ['🤔', '😕', '❓', '🤷', '😳', '👀', '🧐'],
    SERVER_ERROR: ['😭', '😤', '😡', '💢', '💔', '😩', '😫', '🔥'],
  } as const;
  ```

- [ ] T005 [P] Add animation settings to packages/insomnia/src/models/settings.ts:
  ```typescript
  enableResponseAnimations?: boolean;  // Default: true
  respectReducedMotion?: boolean;      // Default: true
  ```

- [ ] T006 [P] Add settings UI toggle in packages/insomnia/src/ui/components/settings/general.tsx:
  - Add checkbox "Enable response code celebration animations"
  - Add tooltip: "Show animated emojis when API requests complete. Animations stop when you move your mouse."

- [ ] T007 Create custom hook file packages/insomnia/src/ui/hooks/use-response-animation.ts with type definitions:
  ```typescript
  export type StatusCodeRange = '2xx' | '4xx' | '5xx';
  export type AnimationType = 'balloonUp' | 'confettiDown' | 'spiralDown' | 'straightDown';
  
  export interface ParticleDefinition {
    id: string;
    emoji: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    size: number;
    duration: number;
    delay: number;
    animationType: AnimationType;
    isFading: boolean;
  }
  
  export interface AnimationState {
    isActive: boolean;
    statusCodeRange: StatusCodeRange | null;
    particles: ParticleDefinition[];
    mouseMovedAt: number | null;
    spawnIntervalId: number | null;
  }
  ```

- [ ] T008 Implement utility functions in use-response-animation.ts:
  - `getStatusCodeRange(statusCode: number): StatusCodeRange | null` - categorizes 2xx/4xx/5xx or returns null
  - `calculateEmojiSize(viewportHeight: number, viewportWidth: number): number` - returns min dimension * 0.05
  - `calculateAnimationDuration(viewportHeight: number): number` - returns (height / 384) * 1000 for 4"/sec
  - `generateSpawnDelay(min: number, max: number): number` - returns random delay 0-500ms

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Success Celebration (200s) (Priority: P1) 🎯 MVP

**Goal**: When API request succeeds (2xx), show balloons floating upward and confetti falling downward

**Independent Test**: Send GET https://httpbin.org/get → verify balloons float UP, confetti falls DOWN, animations continue until mouse moves

### Implementation for User Story 1

- [ ] T009 [US1] Create ResponseCelebration.tsx component file in packages/insomnia/src/ui/components/animations/ResponseCelebration.tsx:
  - Import styled-components
  - Define component props interface (statusCode, enabled?, onAnimationComplete?)
  - Set up basic component structure with React.memo
  - Add JSDoc comments explaining component purpose

- [ ] T010 [US1] Implement viewport calculations in ResponseCelebration.tsx:
  - Get window.innerHeight and window.innerWidth
  - Calculate emoji size using calculateEmojiSize utility
  - Calculate animation duration using calculateAnimationDuration utility
  - Store in React state or useMemo for performance

- [ ] T011 [US1] Implement status code categorization logic in ResponseCelebration.tsx:
  - Use getStatusCodeRange utility to categorize statusCode prop
  - Return null if not 2xx/4xx/5xx (no animation)
  - Set up AnimationState with statusCodeRange

- [ ] T012 [US1] Create CSS keyframes for SUCCESS animations in ResponseCelebration.tsx (styled-components):
  ```css
  @keyframes balloonFloatUp {
    from { transform: translateY(105vh) translateX(var(--start-x)); opacity: 1; }
    to { transform: translateY(-5vh) translateX(var(--end-x)); opacity: 1; }
  }
  
  @keyframes confettiFallDown {
    from { transform: translateY(-5vh) translateX(var(--start-x)) rotate(0deg); opacity: 1; }
    to { transform: translateY(105vh) translateX(var(--end-x)) rotate(var(--rotation)); opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  ```

- [ ] T013 [US1] Implement particle spawning logic for 2xx SUCCESS in ResponseCelebration.tsx:
  - Create generateParticle function that builds ParticleDefinition
  - For balloons: startY = 105vh, endY = -5vh, animationType = 'balloonUp'
  - For confetti: startY = -5vh, endY = 105vh, animationType = 'confettiDown'
  - Random startX across viewport width
  - Add ±2% drift for balloons, ±5% for confetti in endX
  - Random rotation for confetti (0-360deg)
  - Use calculateEmojiSize and calculateAnimationDuration utilities
  - Random delay 0-500ms

- [ ] T014 [US1] Implement particle spawn interval in ResponseCelebration.tsx:
  - When statusCodeRange changes to '2xx', start setInterval (every 100-200ms)
  - Each interval: generate new particle, add to particles array
  - Stop spawning when reach 25 particles total OR mouse moves
  - Store intervalId in AnimationState.spawnIntervalId

- [ ] T015 [US1] Implement mouse movement detection in ResponseCelebration.tsx:
  - Add onMouseMove event listener to overlay container
  - On first mouse move: set AnimationState.mouseMovedAt = Date.now()
  - Clear spawn interval (stop new particles)
  - Set isFading = true on all existing particles

- [ ] T016 [US1] Implement 2-second fade-out on mouse movement in ResponseCelebration.tsx:
  - When mouseMovedAt is set, add CSS class .particle--fading to all particles
  - .particle--fading applies: animation: fadeOut 2s linear forwards !important
  - After 2 seconds, clear all particles from array
  - Reset AnimationState to idle

- [ ] T017 [US1] Render particle DOM elements in ResponseCelebration.tsx:
  - Map over AnimationState.particles array
  - Render each as absolutely positioned <span> with emoji character
  - Apply CSS animation based on animationType
  - Set CSS variables: --start-x, --end-x, --rotation, --animation-duration
  - Set fontSize to calculated size, apply delay
  - Use particle.id as React key

- [ ] T018 [US1] Style overlay container in ResponseCelebration.tsx using styled-components:
  - position: fixed (or absolute relative to response pane)
  - top: 0, left: 0, right: 0, bottom: 0
  - pointer-events: none (don't block interaction with response content)
  - z-index: 1000 (above response content but below modals)
  - overflow: hidden (clip particles at edges)

- [ ] T019 [US1] Integrate ResponseCelebration into packages/insomnia/src/ui/components/panes/response-pane.tsx:
  - Import ResponseCelebration component
  - Get settings.enableResponseAnimations from useRootLoaderData()
  - Get activeResponse.statusCode
  - Add `<ResponseCelebration statusCode={activeResponse.statusCode} enabled={settings.enableResponseAnimations} />` inside <Pane> wrapper
  - Position overlay to cover response pane area

- [ ] T020 [US1] Add accessibility support in ResponseCelebration.tsx:
  - Detect `prefers-reduced-motion` CSS media query using window.matchMedia
  - If reduced motion enabled: return null (no animations)
  - Add aria-live region for screen reader announcement
  - On animation start: announce "Request succeeded" via aria-live

**Checkpoint**: At this point, User Story 1 (2xx SUCCESS) should be fully functional and testable independently

---

## Phase 4: User Story 2 - Client Error Confusion (400s) (Priority: P2)

**Goal**: When API request fails with client error (4xx), show confused emojis spiraling downward

**Independent Test**: Send GET https://httpbin.org/status/404 → verify confused emojis SPIRAL downward, animations continue until mouse moves

### Implementation for User Story 2

- [ ] T021 [US2] Add spiral CSS keyframes to ResponseCelebration.tsx:
  ```css
  @keyframes spiralDown {
    from { 
      transform: translateY(-5vh) translateX(0) rotate(0deg); 
      opacity: 1; 
    }
    to { 
      transform: translateY(105vh) translateX(var(--spiral-x)) rotate(360deg); 
      opacity: 1; 
    }
  }
  ```

- [ ] T022 [US2] Extend particle spawning logic for 4xx CLIENT_ERROR in ResponseCelebration.tsx:
  - Add condition: if statusCodeRange === '4xx'
  - Select random emoji from RESPONSE_CELEBRATION_EMOJIS.CLIENT_ERROR
  - Calculate spiral X offset using Math.sin(index * 0.5) * (viewportWidth * 0.15)
  - Set animationType = 'spiralDown'
  - startY = -5vh, endY = 105vh (top to bottom)
  - Set CSS variable --spiral-x to calculated offset
  - Spawn 15 particles total for 4xx

- [ ] T023 [US2] Update spawn interval logic in ResponseCelebration.tsx:
  - Handle both '2xx' and '4xx' ranges in spawn function
  - Use switch/case on statusCodeRange
  - For '4xx': spawn pairs (confused emoji + question mark ❓) with 200ms stagger
  - Apply 1 full rotation over duration (360deg)

- [ ] T024 [US2] Update screen reader announcement in ResponseCelebration.tsx:
  - Add condition for '4xx': announce "Client error" via aria-live region

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Server Error Frustration (500s) (Priority: P3)

**Goal**: When API request fails with server error (5xx), show crying/angry emojis falling straight downward

**Independent Test**: Send GET https://httpbin.org/status/500 → verify emojis fall STRAIGHT DOWN (no drift), animations continue until mouse moves

### Implementation for User Story 3

- [ ] T025 [US3] Add straight fall CSS keyframes to ResponseCelebration.tsx:
  ```css
  @keyframes straightFall {
    from { 
      transform: translateY(-5vh) translateX(var(--start-x)); 
      opacity: 1; 
    }
    to { 
      transform: translateY(105vh) translateX(var(--start-x)); /* Same X = no drift */
      opacity: 1; 
    }
  }
  ```

- [ ] T026 [US3] Extend particle spawning logic for 5xx SERVER_ERROR in ResponseCelebration.tsx:
  - Add condition: if statusCodeRange === '5xx'
  - Select random emoji from RESPONSE_CELEBRATION_EMOJIS.SERVER_ERROR
  - Set animationType = 'straightFall'
  - startY = -5vh, endY = 105vh
  - endX = startX (no horizontal drift - straight down)
  - Spawn 18 particles total for 5xx

- [ ] T027 [US3] Update spawn interval to handle all three ranges in ResponseCelebration.tsx:
  - Complete switch/case: '2xx', '4xx', '5xx'
  - For '5xx': continuous stream with slight random horizontal spacing (but no drift during fall)
  - Visual "heavy" effect: use base duration without modification

- [ ] T028 [US3] Update screen reader announcement for 5xx in ResponseCelebration.tsx:
  - Add condition for '5xx': announce "Server error" via aria-live region

**Checkpoint**: All three user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T029 [P] Add inline code comments throughout ResponseCelebration.tsx explaining:
  - Why 4 inches/sec speed chosen (research.md rationale)
  - How viewport calculations work
  - Mouse movement behavior (fleeting, whimsical design)
  - Off-screen spawning technique (particles start beyond edges)

- [ ] T030 [P] Add JSDoc comments to all functions in use-response-animation.ts:
  - Document parameters and return types
  - Add @example blocks showing usage
  - Explain calculation formulas (DPI, speed, sizing)

- [ ] T031 [P] Optimize performance in ResponseCelebration.tsx:
  - Add React.memo to prevent unnecessary re-renders
  - Use useMemo for expensive calculations (viewport size, duration)
  - Use useCallback for mouse event handler
  - Add will-change: transform, opacity CSS hint to particles

- [ ] T032 [P] Handle edge cases in ResponseCelebration.tsx:
  - New response arrives: clear previous animations immediately (useEffect cleanup)
  - Application loses focus: pause CSS animations (animation-play-state: paused)
  - Application regains focus: resume CSS animations
  - Very small viewport (<500px): scale particle count proportionally

- [ ] T033 Add feature README in specs/001-response-celebration-animations/README.md documenting:
  - How to test the feature (reference quickstart.md)
  - How to modify emoji sets (edit constants.ts)
  - How to adjust animation speed/size (viewport calculations)
  - Architecture overview (component structure)

- [ ] T034 Manual testing using quickstart.md validation:
  - Test all three animation types (2xx, 4xx, 5xx)
  - Verify mouse movement behavior
  - Test settings toggle
  - Verify accessibility (reduced motion)
  - Check performance (Chrome DevTools FPS counter)
  - Test on different screen sizes and DPI

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3, 4, 5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends US1 component but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Extends US1 component but independently testable

**Note**: User Stories 2 and 3 extend the same ResponseCelebration.tsx component created in US1, but they add independent animation logic that doesn't break existing behavior. Each can be tested independently.

### Within Each User Story

- Setup/Infrastructure first (component file creation)
- CSS keyframes before particle spawning logic
- Particle spawning logic before spawn interval
- Mouse detection after core animation works
- Integration into response-pane after component complete
- Accessibility support throughout

### Parallel Opportunities

- **Phase 1 (Setup)**: All 3 tasks can run in parallel (T001, T002, T003 are [P])
- **Phase 2 (Foundational)**: Tasks T004, T005, T006 can run in parallel (different files)
- **Phase 6 (Polish)**: Tasks T029, T030, T031, T032 can run in parallel (different aspects)

**Note**: User Stories (Phases 3-5) modify the same ResponseCelebration.tsx file, so they should be done sequentially or carefully merged if worked in parallel by different developers.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (3 tasks)
2. Complete Phase 2: Foundational (5 tasks - CRITICAL)
3. Complete Phase 3: User Story 1 (12 tasks)
4. **STOP and VALIDATE**: Test User Story 1 independently using quickstart.md
5. If working: Proceed to US2, otherwise debug US1 first

**This gives you a working MVP**: Success celebrations (2xx) with balloons/confetti and mouse-triggered dismissal

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (8 tasks)
2. Add User Story 1 → Test independently → MVP complete! (12 tasks)
3. Add User Story 2 → Test independently → 4xx support added (4 tasks)
4. Add User Story 3 → Test independently → 5xx support added (4 tasks)
5. Polish → Add final touches (6 tasks)

**Total: 34 tasks**

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (8 tasks - ~2-3 hours)
2. Once Foundational is done:
   - Developer A: User Story 1 (12 tasks - ~4 hours)
   - Developer B: Can prepare tests, documentation, or wait for US1 complete
3. After US1 complete:
   - Developer A: User Story 2 (4 tasks - ~1 hour)
   - Developer B: User Story 3 (4 tasks - ~1 hour) - Can work simultaneously if careful about merge conflicts
4. Together: Polish phase (6 tasks - ~2 hours)

**Alternative**: Single developer, sequential approach: ~14-19 hours total (as estimated in plan.md)

---

## Task Count Summary

- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 5 tasks (BLOCKING)
- **Phase 3 (User Story 1 - MVP)**: 12 tasks
- **Phase 4 (User Story 2)**: 4 tasks
- **Phase 5 (User Story 3)**: 4 tasks
- **Phase 6 (Polish)**: 6 tasks

**Total**: 34 tasks

**MVP Scope**: Phases 1-3 = 20 tasks (success celebrations only)

**Parallel Opportunities**: 7 tasks marked [P] can run in parallel with others

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No test tasks included (not requested in spec, manual testing via quickstart.md)
- Commit after completing each phase or logical grouping
- Stop at any checkpoint to validate story independently
- Avoid: working on same file in parallel (ResponseCelebration.tsx modified by all 3 user stories)
- All animation logic in ONE file (ResponseCelebration.tsx) per Constitution principle III (File Organization)

