# Profile Module

This folder contains all screens and functionality related to the user profile and account management in the WanderLanka mobile app.

## File Structure

### Core Profile Screens
- `edit-profile.tsx` - Edit user profile information
- `achievements.tsx` - View and track travel achievements
- `privacy-security.tsx` - Privacy settings and security options

### Travel & Memories
- `trip-timeline.tsx` - Timeline view of all trips
- `trip-memories.tsx` - Photo and video memories from trips

### Loyalty & Rewards
- `loyalty-points.tsx` - View and manage loyalty points
- `discount-coupons.tsx` - Available discount coupons

### Support & Feedback
- `faq-help.tsx` - FAQ and help documentation
- `rate-app.tsx` - App rating and feedback system

## Navigation

All profile screens are accessible from the main profile tab located at:
- `app/(travelerTabs)/profile.tsx`

Navigation paths use the `/profile/` prefix:
- `/profile/edit-profile`
- `/profile/achievements`
- `/profile/trip-timeline`
- etc.

## Dependencies

All screens use shared components from:
- `../../components/` - Custom UI components
- `../../constants/Colors` - App color scheme

## Architecture

Each screen follows a consistent pattern:
- TypeScript with proper type definitions
- React Native with Expo Router navigation
- Mock data that can be easily replaced with API calls
- Consistent styling using the app's design system
- Error handling and user feedback
