# Mobile App Network Configuration

## Current Network Issue
Your Mac's IP address has changed from `10.21.88.227` to `192.168.1.12`. The mobile app needs to be configured with the correct IP to connect to the API Gateway.

## Quick Fix

### Option 1: Create a `.env` file (Recommended for Physical Devices)

Create a file named `.env` in the `wanderlanka-mobile-app` directory with:

```bash
# For physical devices on the same WiFi network:
EXPO_PUBLIC_API_URL=http://192.168.1.12:3000
```

### Option 2: Hardcode the URL (Quick Test)

Edit `wanderlanka-mobile-app/services/config.ts` and temporarily change line 11-12 to:

```typescript
const DEV_BASE_URL = 'http://192.168.1.12:3000';
```

## Device-Specific URLs

### Physical Device (iPhone/Android on same WiFi)
```
EXPO_PUBLIC_API_URL=http://192.168.1.12:3000
```

### iOS Simulator
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Android Emulator
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

## How to Find Your Mac's IP

Run this command in terminal:
```bash
ipconfig getifaddr en0
```

Or go to: **System Preferences > Network > WiFi/Ethernet > Advanced > TCP/IP**

## Verification Steps

1. **Check API Gateway is running:**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"status":"healthy"}`

2. **Check from your Mac's IP:**
   ```bash
   curl http://192.168.1.12:3000/health
   ```
   Should also return: `{"status":"healthy"}`

3. **Restart your Expo app** after making changes to `.env`

4. **Look for debug logs** in your app console:
   ```
   🌐 API_CONFIG - Platform: ios
   🌐 API_CONFIG - ENV_BASE_URL: http://192.168.1.12:3000
   🌐 API_CONFIG - Selected BASE_URL: http://192.168.1.12:3000
   🔐 Attempting login to: http://192.168.1.12:3000/api/auth/login
   ```

## Common Issues

### "Network request failed"
- Your device and Mac are on different WiFi networks
- Your Mac's IP has changed
- Firewall is blocking port 3000

### "Network request timed out"
- The URL is incorrect
- API Gateway is not running
- Port 3000 is not accessible

### Still having issues?
1. Make sure your phone and Mac are on the **same WiFi network**
2. Check if your Mac's firewall is allowing incoming connections on port 3000
3. Try pinging your Mac from your phone using a network utility app

