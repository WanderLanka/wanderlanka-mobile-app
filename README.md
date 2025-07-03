# WanderLanka Mobile App

A React Native mobile application for exploring Sri Lankan destinations and planning travel experiences.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Expo Go app on your mobile device

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open the Expo Go app on your device and scan the QR code

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
wanderlanka-mobile-app/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Home page
│   └── global.css         # Global styles
├── components/            # Reusable UI components
│   ├── ThemedText.tsx     # Themed text component
│   ├── ThemedView.tsx     # Themed view component
│   └── index.ts           # Component exports
├── constants/             # App constants
│   ├── Colors.ts          # Color palette
│   └── Layout.ts          # Layout constants
├── hooks/                 # Custom React hooks
│   └── useFontLoader.ts   # Font loading hook
├── types/                 # TypeScript type definitions
│   └── index.ts           # Common types
├── utils/                 # Utility functions
│   ├── responsive.ts      # Responsive design helpers
│   ├── shadows.ts         # Shadow utilities
│   └── typography.ts      # Typography utilities
└── assets/               # Static assets
    ├── fonts/            # Custom fonts
    └── images/           # Images and icons
```

## 🎨 Design System

### Colors
- Primary: Green shades (#059669)
- Secondary: Gray shades 
- Semantic: Success, Warning, Error, Info

### Typography
- Primary Font: Poppins (headings)
- Secondary Font: Inter (body text)
- Accent Font: Nunito (special text)

### Components
- `ThemedText`: Styled text with variants
- `ThemedView`: Styled view with theme colors

## 🛠️ Development

### Adding New Pages
1. Create a new file in the `app/` directory
2. Export a React component as default
3. Expo Router will automatically create a route

### Creating Components
1. Add new components to the `components/` directory
2. Export them from `components/index.ts`
3. Use TypeScript interfaces for props

### Styling
- Uses NativeWind (Tailwind CSS for React Native)
- Custom colors defined in `constants/Colors.ts`
- Responsive utilities in `utils/responsive.ts`

## 📱 Features (Planned)

- [ ] Destination discovery
- [ ] Trip planning
- [ ] User authentication
- [ ] Reviews and ratings
- [ ] Map integration
- [ ] Offline support
- [ ] Push notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
