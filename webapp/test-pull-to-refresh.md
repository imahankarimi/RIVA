# Pull-to-Refresh Test Scenarios

## Critical Test Cases

### ✅ Test 1: Middle of Page Pull (MUST NOT REFRESH)
1. Open Overview page
2. Scroll to middle of content
3. Perform small downward pull gesture
4. **Expected:** Normal scrolling, NO refresh indicator
5. **Previously Failed:** Would trigger refresh

### ✅ Test 2: Bottom of Page Pull (MUST NOT REFRESH)
1. Open Overview page
2. Scroll to bottom
3. Perform downward pull gesture
4. **Expected:** Normal scrolling, NO refresh indicator
5. **Previously Failed:** Would trigger refresh

### ✅ Test 3: Top - Short Pull (MUST NOT REFRESH)
1. Open Overview page
2. Scroll to absolute top (scrollTop = 0)
3. Perform short downward pull (< 80px effective distance)
4. Release
5. **Expected:** Indicator appears briefly, then cancels. NO refresh.

### ✅ Test 4: Top - Full Pull (SHOULD REFRESH)
1. Open Overview page
2. Scroll to absolute top
3. Pull downward beyond threshold (indicator turns signal-500 color)
4. Release
5. **Expected:**
   - Indicator shows "ready" state (signal color)
   - On release, spinner animates
   - Data refreshes (only once)
   - Indicator smoothly disappears

### ✅ Test 5: Cancel Before Threshold
1. Scroll to top
2. Start pulling
3. Release before threshold
4. **Expected:** Indicator animates back, NO refresh

### ✅ Test 6: Single Refresh Per Gesture
1. Scroll to top
2. Pull beyond threshold
3. Hold gesture (don't release immediately)
4. **Expected:** Only ONE refresh triggers when released, not multiple

### ✅ Test 7: Tab Navigation
1. Perform pull-to-refresh on Overview
2. Navigate to Cash tab
3. Navigate back to Overview
4. Try pull-to-refresh again
5. **Expected:** Still works correctly

### ✅ Test 8: Scroll Up from Middle
1. Scroll to middle
2. Scroll up quickly back to top
3. Continue upward pull
4. **Expected:** Should NOT trigger refresh mid-scroll

## Animation States to Verify

### Idle
- Indicator: Hidden (opacity 0)
- Scroll: Normal

### Pulling (< threshold)
- Indicator: Visible, moves with pull
- Icon: Rotates based on progress
- Color: ink-soft (muted)
- Ring: line/60 (subtle)

### Ready (>= threshold)
- Indicator: Scales up slightly (1.1x)
- Icon: Full rotation (180deg)
- Color: signal-500 (active)
- Ring: signal-500/40 (highlighted)

### Refreshing
- Indicator: Fixed position
- Icon: Spinning animation
- Color: signal-500
- Ring: signal-500/40

### Completing
- Smooth fade out (300ms)
- Returns to idle

## Technical Verification

### Check scroll container
```javascript
const main = document.getElementById('webapp-main-scroll');
console.log('Scroll container:', main);
console.log('scrollTop:', main.scrollTop);
```

### Monitor touch events
Open browser DevTools > Console while testing to see:
- "Pull-to-refresh: Could not find scroll container" = ERROR
- Should attach to `#webapp-main-scroll`

### Verify scrollTop detection
1. Scroll to middle: `main.scrollTop > 0` ✓
2. Scroll to top: `main.scrollTop === 0` ✓
3. Pull should only work when scrollTop ≤ 1

## Cross-Platform Testing

### iOS Safari
- [ ] Pull-to-refresh works at top only
- [ ] No conflict with iOS native pull-to-refresh
- [ ] Smooth animation
- [ ] Safe area respected (notch)

### Android Chrome
- [ ] Pull-to-refresh works at top only
- [ ] No conflict with Android overscroll
- [ ] Touch response is smooth

### PWA Mode
- [ ] Works when installed as PWA
- [ ] No page reload (only data refresh)

## Performance Checks

- [ ] No jank during pull animation
- [ ] Smooth 60fps animation
- [ ] No layout shifts
- [ ] Quick response to touch
- [ ] Memory: No event listener leaks

## Edge Cases

- [ ] Rapid tab switching during refresh
- [ ] Refresh triggered while already refreshing
- [ ] Touch cancel (finger slides off screen)
- [ ] Landscape orientation
- [ ] Different screen sizes (375px, 768px, 1440px)
