# GoyXCloud

[![Build GoyXCloud Android APK](https://github.com/GoyDevv/GoyXCloud/actions/workflows/build-apk.yml/badge.svg)](https://github.com/GoyDevv/GoyXCloud/actions/workflows/build-apk.yml)

**GoyXCloud** (`com.goydevv.xcloud`) is an optimized Android client for Xbox Cloud Gaming (xCloud) with embedded **Better xCloud**, a **Touch PC Keyboard & Mouse (KBM) Overlay**, and a **Right-Thumb Zero-Delay Direct Mouse Delta Touchpad** built specifically for FPS titles such as *Call of Duty: Warzone*.

---

## Features

- **Package**: `com.goydevv.xcloud`
- **Native KBM Pipeline**: Direct mouse delta and keyboard input injection into xCloud streams without requiring external USB OTG hardware.
- **Zero-Delay Mouse Delta Touchpad**: High-precision right-thumb touchpad with customizable sensitivity, ADS multipliers, and swipe-through aim.
- **Warzone Tactical HUD**: Built-in 8-way WASD joystick, auto tac-sprint ring, weapon switch, stance controls, and full 104-key virtual keyboard drawer.
- **Permanent Layout Storage**: Redundant state persistence via Android `SharedPreferences`, internal atomic files, `localStorage`, and `indexedDB`.
- **Automated CI/CD**: Automatic APK build workflows on GitHub Actions with debug and release artifacts.

---

## Building from Source

### Requirements
- Android SDK (API 34)
- JDK 17
- Gradle 8.5

### Build Commands
```bash
# Build Debug APK
gradle assembleDebug

# Build Release APK
gradle assembleRelease
```

Output APKs will be located under `app/build/outputs/apk/`.
