# Quickstart: Response Code Celebration Animations

**Feature**: Response Code Celebration Animations  
**Version**: 1.0.0  
**Last Updated**: 2025-11-14

## Overview

This guide helps you quickly test and experience the Response Code Celebration Animations feature in Insomnia. Whether you're a developer validating the implementation or a user exploring the feature, this guide will walk you through testing all animation types.

## Prerequisites

- Insomnia running locally (version 9.3.3+)
- Internet connection (for test API endpoints)
- Mouse/trackpad (animations respond to mouse movement)

## Quick Test (30 seconds)

**Test all three animation types in 30 seconds:**

1. **Success (2xx)** - Open Insomnia, create a new request:
   - URL: `https://httpbin.org/get`
   - Method: GET
   - Click "Send"
   - **Expected**: Balloons float UP, confetti falls DOWN

2. **Client Error (4xx)** - Change the URL:
   - URL: `https://httpbin.org/status/404`
   - Click "Send"
   - **Expected**: Confused emojis SPIRAL downward

3. **Server Error (5xx)** - Change the URL:
   - URL: `https://httpbin.org/status/500`
   - Click "Send"
   - **Expected**: Crying/angry emojis fall STRAIGHT down

4. **Dismissal** - After any animation starts:
   - Move your mouse
   - **Expected**: Animations fade out within 2 seconds

---

## Detailed Testing

### Test 1: Success Celebration (200s)

**Goal**: Verify upward balloons and downward confetti

**Test Endpoints**:
```
GET https://httpbin.org/get           → 200 OK
POST https://httpbin.org/post         → 200 OK (with body)
GET https://httpbin.org/status/201    → 201 Created
GET https://httpbin.org/status/204    → 204 No Content
```

**What to Look For**:
- ✅ Balloons (🎈) float UPWARD from bottom of screen
- ✅ Confetti (🎉 🎊 ✨ 🌟 💫) falls DOWNWARD from top
- ✅ Hearts (❤️) and explosions (💥) appear
- ✅ Approximately 25 total particles
- ✅ Emojis start OFF-SCREEN (not visible on spawn)
- ✅ Movement is smooth, approximately 4 inches per second
- ✅ Animations continue until you move mouse
- ✅ On mouse move: new particles stop, existing fade in 2 seconds

**Visual Philosophy**: *Celebratory, joyful, fleeting*

---

### Test 2: Client Error Confusion (400s)

**Goal**: Verify spiral downward pattern

**Test Endpoints**:
```
GET https://httpbin.org/status/400    → 400 Bad Request
GET https://httpbin.org/status/401    → 401 Unauthorized
GET https://httpbin.org/status/404    → 404 Not Found
GET https://httpbin.org/status/429    → 429 Too Many Requests
```

**What to Look For**:
- ✅ Confused emojis (🤔 😕 😳) and question marks (❓)
- ✅ SPIRAL downward pattern (not straight down)
- ✅ Approximately 15 total particles
- ✅ Emojis rotate while spiraling
- ✅ Spawn in pairs (emoji + question mark)
- ✅ Movement starts from top edge (off-screen)
- ✅ Spiral radius approximately ±15% of screen width
- ✅ Mouse movement stops spawning, triggers 2-second fade

**Visual Philosophy**: *Contemplative, questioning, non-judgmental*

---

### Test 3: Server Error Frustration (500s)

**Goal**: Verify straight downward fall

**Test Endpoints**:
```
GET https://httpbin.org/status/500    → 500 Internal Server Error
GET https://httpbin.org/status/502    → 502 Bad Gateway
GET https://httpbin.org/status/503    → 503 Service Unavailable
GET https://httpbin.org/status/504    → 504 Gateway Timeout
```

**What to Look For**:
- ✅ Frustrated emojis (😭 😤 😡 💔 🔥)
- ✅ Fall STRAIGHT downward (no horizontal drift)
- ✅ Approximately 18 total particles
- ✅ "Heavy" feeling (faster perceived speed)
- ✅ No spiral or drift (pure vertical descent)
- ✅ Continuous stream from top edge
- ✅ Mouse movement stops spawning, triggers fade

**Visual Philosophy**: *Empathetic frustration, acknowledging server issues*

---

### Test 4: Mouse Movement Behavior

**Goal**: Verify natural dismissal mechanism

**Steps**:
1. Send any request that triggers animations (e.g., `GET https://httpbin.org/get`)
2. **Wait** - Let animations continue for 2-3 seconds without moving mouse
3. **Move mouse** anywhere in the application window
4. **Observe**:
   - ✅ No new particles spawn after mouse movement
   - ✅ Existing particles begin fading immediately
   - ✅ All particles completely transparent within 2 seconds
   - ✅ Response content remains fully accessible during fade

**Expected Behavior**: Animations gracefully defer to user intent ("back to work")

---

### Test 5: No Animation for 1xx/3xx

**Goal**: Verify informational and redirect responses don't animate

**Test Endpoints**:
```
GET https://httpbin.org/redirect/1    → 302 Found (redirect)
(No easy test for 1xx in httpbin)
```

**Expected**: No animations appear (avoids visual noise for non-final responses)

---

## Settings Tests

### Enable/Disable Toggle

**Location**: Settings > General > Appearance

**Test**:
1. Uncheck "Enable response code celebration animations"
2. Send request: `GET https://httpbin.org/get`
3. **Expected**: No animations appear
4. Re-check the toggle
5. Send request again
6. **Expected**: Animations appear

---

### Reduced Motion Accessibility

**Goal**: Verify animations respect OS accessibility settings

**macOS**:
1. System Settings > Accessibility > Display
2. Enable "Reduce motion"
3. Send request in Insomnia
4. **Expected**: No animations (accessibility respected)

**Windows**:
1. Settings > Ease of Access > Display
2. Enable "Show animations in Windows"
3. Test similarly

**Linux**:
1. Varies by desktop environment
2. GTK: `gsettings set org.gnome.desktop.interface enable-animations false`

---

## Visual Validation Checklist

### Size Validation

**Goal**: Emojis should be noticeable but not overwhelming

- [ ] Emojis are approximately 5% of screen height
- [ ] On 1920×1080 display: emojis ~54px tall
- [ ] On 2560×1440 display: emojis ~72px tall
- [ ] Emojis maintain readable detail
- [ ] Never feel "too large" or "too small"

### Speed Validation

**Goal**: ~4 inches per second movement speed

**Visual Test**:
1. Hold a physical ruler against your screen
2. Watch a particle move past the 4-inch mark
3. **Expected**: Takes approximately 1 second

**OR** use stopwatch:
- 1080px screen height ÷ 384px/sec = ~2.8 seconds full traversal
- 1920px screen height ÷ 384px/sec = ~5.0 seconds full traversal

### Off-Screen Spawning

**Goal**: Particles should appear to emerge from edges, not pop into view

- [ ] Balloons: First visible at bottom edge, already moving up
- [ ] Confetti: First visible at top edge, already moving down
- [ ] Spirals: First visible at top edge, already spiraling
- [ ] Straight fall: First visible at top edge, already falling
- [ ] **Never** see particles suddenly appear mid-screen

---

## Troubleshooting

### Animations Don't Appear

**Check**:
1. Settings toggle enabled?
2. OS "reduce motion" disabled?
3. Response has eligible status code (2xx/4xx/5xx)?
4. HTTP/REST request? (WebSocket/gRPC not supported in MVP)

### Animations Look Choppy

**Check**:
1. Open Chrome DevTools Performance panel
2. Record while animation runs
3. Check FPS (should be 59-60)
4. Check CPU usage (should be <5%)
5. If performance bad: File bug with system specs

### Mouse Movement Doesn't Stop Animations

**Check**:
1. Move mouse **within** Insomnia window
2. Move mouse **after** animations start (not before)
3. Application window is focused (active)

### Emojis Too Small/Large

**Check**:
1. Viewport size calculation issue
2. Expected: `Math.min(window.innerHeight, window.innerWidth) * 0.05`
3. File bug with screen resolution and actual emoji size

---

## Performance Validation

### FPS Test

**Tools**: Chrome DevTools > Performance

**Steps**:
1. Open DevTools in Insomnia (Cmd+Opt+I / Ctrl+Shift+I)
2. Go to Performance tab
3. Click Record
4. Send request: `GET https://httpbin.org/get`
5. Let animations run for 3 seconds
6. Stop recording
7. **Expected**: FPS graph shows steady 59-60 FPS

### Memory Test

**Tools**: Chrome DevTools > Memory

**Steps**:
1. Take heap snapshot before animations
2. Send request, let animations complete
3. Move mouse, wait 2 seconds for cleanup
4. Take second heap snapshot
5. Compare
6. **Expected**: < 5MB increase

---

## Edge Case Testing

### Rapid Requests

**Test**:
1. Create request: `GET https://httpbin.org/get`
2. Click "Send" 5 times rapidly
3. **Expected**: Previous animations cancel, new ones start
4. No visual stacking or performance degradation

### Small Window

**Test**:
1. Resize Insomnia to minimum window size
2. Send request
3. **Expected**: Animations scale proportionally
4. Emojis still readable, just smaller

### Large 4K Display

**Test**:
1. Test on 3840×2160 display
2. **Expected**: Emojis appropriately larger (~108px)
3. Animation speed feels consistent (still ~4"/sec)

---

## Demo Scenarios

### For Stakeholders

**Scenario**: "Show me what this looks like"

1. Open Insomnia
2. Create request: `GET https://httpbin.org/status/200`
3. Say: "When an API call succeeds, you see this celebration"
4. Click "Send"
5. **Point out**: Balloons going up, confetti falling down
6. Move mouse to show natural dismissal

### For QA Testing

**Scenario**: Comprehensive validation

1. Use checklist above
2. Test all three animation types
3. Validate mouse behavior
4. Check accessibility
5. Performance profiling
6. Document any deviations

---

## Support

**Questions?** Check:
- Feature spec: `specs/001-response-celebration-animations/spec.md`
- Implementation plan: `specs/001-response-celebration-animations/plan.md`
- Data model: `specs/001-response-celebration-animations/data-model.md`

**Found a bug?**
1. Note: Status code, animation type, OS, screen resolution
2. Capture video if possible (helps visualize timing issues)
3. Check Chrome DevTools console for errors
4. File GitHub issue with details

---

## Visual Style Summary

**Remember**: *Fleeting, whimsical, nonintrusive. Charm balanced with professionalism.*

The animations are designed to:
- ✨ Create moments of delight
- 🎯 Provide immediate visual feedback
- 🖱️ Defer to user intent (mouse movement = back to work)
- 📊 Never block or delay access to response data
- ♿ Respect accessibility preferences

Enjoy the celebrations! 🎉

