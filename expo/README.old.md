# Caller Minutes

A comprehensive contact management and call notes app built with React Native and Expo.

## Features

- 📞 Call notes and contact management
- 📝 Note-taking with templates
- 📋 Reminders and task management
- 🛍️ Shopify integration
- 💼 Business card management
- 🏃‍♂️ Plan a run feature
- 📱 Cross-platform (iOS, Android, Web)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### For Windows PC:

1. **Node.js** (v18 or later)

- Download from [nodejs.org](https://nodejs.org/)
- Choose the LTS version
- Verify installation: `node --version` and `npm --version`

2. **Bun** (Package manager and runtime)

- Install via PowerShell: `powershell -c "irm bun.sh/install.ps1 | iex"`
- Or download from [bun.sh](https://bun.sh/)
- Verify installation: `bun --version`

3. **Git**

- Download from [git-scm.com](https://git-scm.com/download/win)
- Verify installation: `git --version`

4. **Expo CLI** (Optional, for additional features)

- Install globally: `npm install -g @expo/cli`

### For Mac:

1. **Node.js** (v18 or later)

- Install via Homebrew: `brew install node`
- Or download from [nodejs.org](https://nodejs.org/)
- Verify installation: `node --version` and `npm --version`

2. **Bun** (Package manager and runtime)

- Install via curl: `curl -fsSL https://bun.sh/install | bash`
- Or via Homebrew: `brew install bun`
- Verify installation: `bun --version`

3. **Git** (Usually pre-installed)

- If not installed: `brew install git`
- Verify installation: `git --version`

4. **Expo CLI** (Optional, for additional features)

- Install globally: `npm install -g @expo/cli`

## Installation

### 1. Clone the Repository

bash
git clone <your-repository-url>
cd caller-minutes

### 2. Install Dependencies

bash
bun install

## Running the App

### Development Server

To start the development server:
bash
bun run start
This will start the Expo development server with tunneling enabled, allowing you to test on physical devices.

### Web Development

To run the app in web browser:
bash
bun run start-web
For web development with debug logs:
bash
bun run start-web-dev

### Testing on Mobile Devices

1. **Install Expo Go** on your mobile device:

- iOS: Download from App Store
- Android: Download from Google Play Store

2. **Scan QR Code**:

- After running `bun run start`, a QR code will appear in your terminal
- Open Expo Go and scan the QR code
- The app will load on your device

### Testing on Simulators/Emulators

#### iOS Simulator (Mac only):

1. Install Xcode from the Mac App Store
2. Open Xcode and install iOS Simulator
3. Run `bun run start` and press `i` to open in iOS Simulator

#### Android Emulator:

1. Install Android Studio
2. Set up an Android Virtual Device (AVD)
3. Start the emulator
4. Run `bun run start` and press `a` to open in Android Emulator

## Project Structure

├── app/ # App screens and routing
│ ├── (tabs)/ # Tab-based navigation screens
│ ├── \_layout.tsx # Root layout
│ └── index.tsx # Home screen
├── components/ # Reusable UI components
├── hooks/ # Custom React hooks
├── types/ # TypeScript type definitions
├── constants/ # App constants and colors
├── assets/ # Images and static assets
└── package.json # Dependencies and scripts

## Key Technologies

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **Expo Router**: File-based routing
- **React Query**: Server state management
- **AsyncStorage**: Local data persistence
- **Lucide Icons**: Icon library

## Permissions

The app requires the following permissions:

### iOS:

- Contacts access
- Photo library access
- Camera access
- Microphone access

### Android:

- Vibration
- Read/Write contacts
- Camera
- External storage access

## Troubleshooting

### Common Issues:

1. **Metro bundler issues**:
   bash
   bun run start --clear
2. **Node modules issues**:
   bash
   rm -rf node_modules
   bun install
3. **Cache issues**:
   bash
   expo r -c
4. **Port conflicts**:

- The app uses a custom port configuration
- If you encounter port issues, check the `start` script in package.json

### Platform-Specific Issues:

#### Windows:

- Ensure Windows Defender doesn't block the development server
- Use PowerShell or Command Prompt as administrator if needed
- Check firewall settings for Metro bundler

#### Mac:

- Ensure Xcode Command Line Tools are installed: `xcode-select --install`
- For M1/M2 Macs, ensure Node.js is the correct architecture

## Development Tips

1. **Hot Reloading**: The app supports hot reloading - changes will appear automatically
2. **Debugging**: Use React Native Debugger or browser dev tools
3. **Linting**: Run `bun run lint` to check code quality
4. **Type Checking**: TypeScript will show type errors in your editor

## Building for Production

This project uses Expo Go for development. For production builds, you would need:

1. **Expo Application Services (EAS)**:
   bash
   npm install -g eas-cli
   eas build
2. **Local builds** (requires additional setup):

- iOS: Xcode and Apple Developer account
- Android: Android Studio and keystore

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests and linting: `bun run lint`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## Support

If you encounter any issues:

1. Check the [Expo documentation](https://docs.expo.dev/)
2. Review [React Native documentation](https://reactnative.dev/docs/getting-started)
3. Search existing issues in the repository
4. Create a new issue with detailed information

## License

This project is private and proprietary.
