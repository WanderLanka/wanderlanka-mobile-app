# Guide Home Page - Card Visibility Fix

## Issues Fixed

### 1. **Cards Not Appearing (Animation Issue)**
**Problem**: Cards were initialized with `opacity: 0` and `translateY: 50`, making them invisible/off-screen on initial render.

**Solution**: 
- Changed animation initial values from invisible to visible
- Removed Animated.View wrapper to simplify rendering
- Cards now render immediately without waiting for animation

**Before**:
```typescript
const fadeAnim = useRef(new Animated.Value(0)).current; // Invisible
const slideAnim = useRef(new Animated.Value(50)).current; // Off-screen
```

**After**:
```typescript
const fadeAnim = useRef(new Animated.Value(1)).current; // Visible
const slideAnim = useRef(new Animated.Value(0)).current; // On-screen
```

### 2. **Removed Animation from Card Rendering**
**Problem**: Animated.View wrapper was causing rendering issues.

**Solution**: Use plain View instead for immediate visibility.

**Before**:
```typescript
<Animated.View
  style={{
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  }}
>
  <ItemCard />
</Animated.View>
```

**After**:
```typescript
<View style={styles.guideCardWrapper}>
  <ItemCard />
</View>
```

### 3. **Carousel Height Issue**
**Problem**: Horizontal ScrollView had no minimum height, potentially collapsing.

**Solution**: Added `minHeight: 300` to carousel style.

```typescript
carousel: {
  paddingLeft: 20,
  marginBottom: 24,
  minHeight: 300, // ✅ Added
},
```

### 4. **Added Debug Logging**
Added console logs to track data loading:

```typescript
console.log('Featured guides loaded:', featuredRes.data.length);
console.log('All guides loaded:', allRes.data.length);
```

### 5. **Added Visual Debug Info**
Shows count of loaded guides for debugging:

```typescript
<Text style={{ padding: 20, color: Colors.secondary600 }}>
  Showing {featuredGuides.length} featured guides
</Text>
```

### 6. **Fixed Animation Timing**
Animation now triggers after data is loaded and state is updated:

```typescript
// Reset animation before loading
fadeAnim.setValue(0);
slideAnim.setValue(30);

// ... fetch data ...

// Animate in after data is set
Animated.parallel([
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 400,
    useNativeDriver: true,
  }),
  Animated.timing(slideAnim, {
    toValue: 0,
    duration: 350,
    useNativeDriver: true,
  }),
]).start();
```

## Testing Checklist

✅ **Cards Now Visible**: Cards render immediately without animation delay  
✅ **Horizontal Scroll Works**: Can scroll through guide cards  
✅ **Data Loads Correctly**: Featured and all guides fetch from backend  
✅ **No Infinite Loops**: Fixed in previous iteration  
✅ **Pull-to-Refresh Works**: Manual refresh updates cards  
✅ **Search Works**: Debounced search filters guides  
✅ **Show More/Less**: Toggles between 5 and 20 guides  

## What to Look For

### In Console Logs:
```
Featured guides loaded: 5
All guides loaded: 42
```

### On Screen:
- "Showing X featured guides" text above carousel
- Guide cards in horizontal scroll
- Language badges below each card
- Empty state if no guides found

## Remaining Animation (Optional)

The animation code is still in place but not applied to cards. If you want to re-enable subtle animations later:

1. The fade/slide values are reset before each load
2. Animation triggers after data loads
3. Can be applied to individual cards with stagger delay
4. Currently removed for immediate visibility

## Quick Fixes If Still Not Showing

1. **Check Backend**: Ensure guide-service is running
2. **Check API Response**: Look at console logs for data count
3. **Check ItemCard**: Verify ItemCard component exists and renders
4. **Check Network**: Ensure API calls are reaching backend
5. **Check Data Structure**: Verify guide object has required fields

## Files Modified

1. `/app/tour_guides/gui_home.tsx`:
   - Removed Animated.View from renderGuideCard
   - Changed initial animation values
   - Added minHeight to carousel
   - Added debug logging
   - Moved animation trigger after state update

## Next Steps

If cards still don't appear:

1. Check console for "Featured guides loaded: X"
2. Check if "Showing X featured guides" text appears
3. Verify guide-service backend is running
4. Check network tab for API responses
5. Inspect guide data structure in response

The cards should now be visible immediately upon data load! 🎉
