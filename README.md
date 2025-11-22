# Rork Caller Minutes - Mac Setup Guide

A comprehensive contact management and call notes app built with React Native and Expo.

## Complete Mac Setup from Scratch

Follow this guide to set up and run the app on a Mac with no prior development environment.

---

## Step 1: Install Prerequisites

### 1.1 Install Homebrew (Package Manager)

Open Terminal and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, follow the on-screen instructions to add Homebrew to your PATH.

### 1.2 Install Bun (Fast Package Manager & Runtime)

This project uses Bun for fast package management and development.

```bash
# Install Bun via curl
curl -fsSL https://bun.sh/install | bash

# Restart your terminal or run:
source ~/.zshrc

# Verify installation
bun --version  # Should show v1.x.x
```

**Alternative:** Install via Homebrew:

```bash
brew install bun
```

**Note:** Bun includes a Node.js-compatible runtime, so you don't need to install Node.js separately. However, some tools may still require Node.js, so you can optionally install it via NVM if needed.

### 1.3 Install Git (if not already installed)

```bash
# Check if Git is installed
git --version

# If not installed:
brew install git
```

### 1.4 Install Xcode (for iOS development)

1. Open the **Mac App Store**
2. Search for **Xcode**
3. Click **Install** (this is a large download, ~15GB+)
4. After installation, open Xcode and accept the license agreement
5. Install Command Line Tools:

```bash
xcode-select --install
```

### 1.5 Install CocoaPods (iOS dependency manager)

```bash
sudo gem install cocoapods
```

---

## Step 2: Clone and Setup Project

### 2.1 Clone the Repository

```bash
# Navigate to where you want to store the project
cd ~/Developer  # or your preferred location

# Clone the repository
git clone <your-repository-url> rork-caller-minutes
cd rork-caller-minutes
```

### 2.2 Install Dependencies

This project uses **Bun** for fast dependency installation:

```bash
bun install
```

This process will:

- Install all dependencies from npm registry (Bun uses the same packages as npm)
- Take ~10 seconds (much faster than npm!)
- Create `bun.lockb` lock file for deterministic installs
- No need for `--legacy-peer-deps` - Bun handles peer dependencies automatically

---

## Step 3: Running the App

### Option A: Run on iOS Simulator (Recommended for Testing)

```bash
npx expo run:ios
```

**What happens:**

1. First run will take 10-15 minutes as it:
   - Creates the native iOS project
   - Installs CocoaPods dependencies
   - Compiles all native modules
2. iOS Simulator will launch automatically
3. The app will install and open in the simulator

**Subsequent runs:** Much faster (1-2 minutes) as native modules are already compiled.

### Option B: Run on Physical Device

```bash
npm run start
# or
npx expo start --tunnel
```

Then:

1. Install **Expo Go** from the iOS App Store
2. Scan the QR code that appears in your terminal
3. The app will load on your device

### Option C: Run Android Version

```bash
npm run android
# or
npx expo run:android
```

**Note:** Requires Android Studio and Android emulator setup.

### Option D: Run Web Version

```bash
npm run start-web
# or
npx expo start --web
```

Opens the app in your default web browser.

---

## Step 4: Development Workflow

### Hot Reloading

The app automatically reloads when you save changes to your code. No need to rebuild!

### Useful Commands

```bash
# Start development server
bun run start

# Run on iOS simulator
bun run ios

# Run on Android emulator
bun run android

# Run linter
bun run lint

# Format code with Prettier
bun run format

# Clear cache and restart
bunx expo start --clear

# Show available commands
bunx expo --help

# Install a new package
bun add <package-name>

# Remove a package
bun remove <package-name>
```

---

## Troubleshooting

### Issue: `Cannot find module 'ajv/dist/compile/codegen'`

**Solution:**

```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Issue: `Command not found: npm`

**Solution:** Your shell isn't loading NVM. Add this to `~/.zshrc`:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

Then reload: `source ~/.zshrc`

### Issue: iOS build fails with CocoaPods errors

**Solution:**

```bash
cd ios
pod install
cd ..
npm run ios
```

### Issue: Xcode license not accepted

**Solution:**

```bash
sudo xcodebuild -license accept
```

### Issue: Simulator doesn't launch

**Solution:**

```bash
# Open Simulator manually
open -a Simulator

# Then run the app again
npm run ios
```

### Issue: Port already in use

**Solution:**

```bash
# Kill the process on port 8081
lsof -ti:8081 | xargs kill -9

# Restart the dev server
npm run start
```

### Issue: Build stuck or very slow

**Solution:**

```bash
# Clear all caches
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build
rm package-lock.json
npm install --legacy-peer-deps
```

### Issue: M1/M2 Mac compatibility issues

**Solution:**

```bash
# Ensure you're using the correct architecture
arch -x86_64 pod install  # If needed for compatibility
```

---

## Project Structure

```
rork-caller-minutes/
├── app/                    # App screens and routing (Expo Router)
│   ├── (tabs)/            # Tab-based navigation
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── constants/             # App constants
├── assets/                # Images and static files
├── ios/                   # Native iOS code (generated)
├── android/               # Native Android code (generated)
├── node_modules/          # Dependencies (not committed)
├── package.json           # Project metadata and scripts
└── package-lock.json      # Locked dependency versions
```

---

## Key Technologies

- **React Native 0.79.1**: Cross-platform mobile framework
- **Expo 53**: Development platform and tools
- **React 19**: UI library
- **TypeScript 5.8**: Type-safe JavaScript
- **Expo Router 5**: File-based navigation
- **React Query 5**: Server state management
- **Zustand 5**: Client state management
- **NativeWind 4**: Tailwind CSS for React Native
- **Lucide Icons**: Modern icon library

---

## Required Permissions

### iOS (configured in app.json):

- Contacts access
- Photo library access
- Camera access
- Location access
- Microphone access

### Android:

- Vibration
- Read/Write contacts
- Camera
- Storage access

---

## Environment Variables

This project uses Rork for development. The project ID is configured in `package.json`:

```json
"start": "bunx rork start -p 0eaf3v66gpagx4bd97rl1 --tunnel"
```

---

## Building for Production

### Using Expo Application Services (EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure the project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Local Production Build

**iOS:**
Requires:

- Apple Developer Account ($99/year)
- Provisioning profiles and certificates
- Xcode

```bash
npx expo run:ios --configuration Release
```

**Android:**

```bash
npx expo run:android --variant release
```

---

## Development Tips

1. **Use iOS Simulator for rapid development** - Hot reloading works best here
2. **Test on real devices periodically** - Some features behave differently
3. **Keep dependencies updated** - Run `npm outdated` to check for updates
4. **Use TypeScript strictly** - Catches bugs before runtime
5. **Monitor bundle size** - Large bundles slow down the app

---

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [React Query Documentation](https://tanstack.com/query/latest)

---

## Support

For issues or questions:

1. Check this README first
2. Search existing issues in the repository
3. Review Expo and React Native documentation
4. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Error messages or screenshots
   - Your environment (Mac OS version, Node version, etc.)

---

## License

This project is private and proprietary.

---

## Quick Start Checklist

Use this checklist for first-time setup:

- [ ] Install Homebrew
- [ ] Install NVM and Node.js 18
- [ ] Install Git
- [ ] Install Xcode from Mac App Store
- [ ] Run `xcode-select --install`
- [ ] Install CocoaPods (`sudo gem install cocoapods`)
- [ ] Clone the repository
- [ ] Run `npm install --legacy-peer-deps`
- [ ] Run `npx expo run:ios`
- [ ] Wait for build to complete (10-15 minutes first time)
- [ ] App opens in iOS Simulator
- [ ] Start coding!

---

**Last Updated:** October 2025
**Tested On:** macOS Sequoia 15.0+, Node.js 18.20.8, Expo SDK 53
