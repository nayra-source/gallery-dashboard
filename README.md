# Gallery Dashboard (React / TypeScript Web Client)

`gallery-dashboard` is the administrative web interface for the Gallery remote sync system. Built with React 18, Vite, TypeScript, and Tailwind CSS, it enables administrators to manage paired Android devices, monitor real-time connectivity, generate pairing QR codes, inspect remote photo/video libraries, and initiate secure media file transfers.

---

## Table of Contents
1. [Key Features](#key-features)
2. [Technology Stack](#technology-stack)
3. [Project Directory Structure](#project-directory-structure)
4. [Architecture & Component Overview](#architecture--component-overview)
5. [Authentication & Session Lifecycle](#authentication--session-lifecycle)
6. [Remote Device Command Workflow](#remote-device-command-workflow)
7. [Environment Configuration & API Proxying](#environment-configuration--api-proxying)
8. [Prerequisites & Installation](#prerequisites--installation)
9. [Development & Build Commands](#development--build-commands)
10. [Troubleshooting & Known Limitations](#troubleshooting--known-limitations)

---

## Key Features

* **Admin Authentication**: JWT-based sign-in with automatic token persistence and session expiration interceptors.
* **Device Management**: Real-time list of paired devices, online/offline status indicators, last-seen timestamps, and instant device revocation.
* **Pairing QR Generator**: Requests 6-digit single-use pairing codes from the backend and renders both formatted text and scan-ready QR codes (`qrcode.react`).
* **Remote Media Browser**: Triggers on-demand MediaStore queries on connected Android phones (`LIST_MEDIA`) with infinite scroll, pagination, and album filtering.
* **Thumbnail Rendering**: Fetches on-device generated image/video thumbnails (`GET_THUMBNAIL`) over the command channel.
* **Media Transfer Manager**: Prepares staging file transfers (`PREPARE_DOWNLOAD`), polls transfer progress in a non-blocking widget, and streams full-resolution media downloads.
* **Remote File Operations**: Triggers remote item rename (`RENAME_MEDIA`) and remote item deletion/trashing (`DELETE_MEDIA`) with modal confirmations.

---

## Technology Stack

* **Framework & Build Tool**: React `18.2.0`, Vite `5.1.4`
* **Language**: TypeScript `5.3.3`
* **Styling**: Tailwind CSS
* **Icons & QR**: Lucide React (`lucide-react`), QR Code React (`qrcode.react`)
* **State Management**: React Context (`AuthContext`, `ToastContext`)

---

## Project Directory Structure

```
gallery-dashboard/
├── src/
│   ├── components/
│   │   ├── ConfirmModal.tsx          # Reusable confirmation dialog for destructive actions
│   │   ├── DeviceListScreen.tsx      # Main dashboard view listing paired devices & revocation
│   │   ├── Layout.tsx                # Navigation header, user profile summary, and toast wrapper
│   │   ├── LoginScreen.tsx           # Admin login form
│   │   ├── MediaGridScreen.tsx       # Paginated thumbnail grid for selected remote phone
│   │   ├── MediaViewerModal.tsx      # Full-size image & video player modal
│   │   ├── PairDeviceModal.tsx       # Pairing modal displaying 6-digit code & QR Code
│   │   ├── PrepareDownloadWidget.tsx # Floating transfer staging progress & download launcher
│   │   ├── RenameModal.tsx           # Remote file rename input modal
│   │   └── ThumbnailImage.tsx        # Async thumbnail loader with skeleton loading states
│   ├── context/
│   │   ├── AuthContext.tsx           # Manages JWT token storage (localStorage) & login/logout
│   │   └── ToastContext.tsx          # Global notification system (success, warning, error)
│   ├── services/
│   │   └── api.ts                    # HTTP fetch wrapper, 401 interceptor, and command polling engine
│   ├── types/
│   │   └── index.ts                  # TypeScript DTO interface definitions
│   ├── App.tsx                       # Root application routing and context provider wrapper
│   └── main.tsx                      # DOM entrypoint
├── index.html                        # Application HTML shell
├── package.json                      # Dependencies and npm scripts
├── tsconfig.json                     # TypeScript compiler configuration
└── vite.config.ts                    # Vite dev server configuration & API proxy rules
```

---

## Architecture & Component Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                                 App.tsx                                │
│                   (AuthProvider & ToastProvider Wrappers)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────┐                          ┌──────────────────────┐
│     LoginScreen      │                          │        Layout        │
│  (Admin JWT Sign-in) │                          │ (Header, User Badge) │
└──────────────────────┘                          └──────────┬───────────┘
                                                             │
                                     ┌───────────────────────┴───────────────────────┐
                                     ▼                                               ▼
                         ┌──────────────────────┐                        ┌──────────────────────┐
                         │   DeviceListScreen   │                        │   MediaGridScreen    │
                         │ (Device Status,      │                        │ (Remote Media Grid,  │
                         │  PairDeviceModal)    │                        │  PrepareDownload,    │
                         └──────────────────────┘                        │  Rename / Delete)    │
                                                                         └──────────────────────┘
```

---

## Authentication & Session Lifecycle

1. **Sign-In**: Administrators authenticate at `LoginScreen`.
2. **Token Storage**: Upon successful login, the returned `token` is persisted in browser `localStorage` (`gallery_admin_token`) via `AuthContext`.
3. **Request Authorization**: All API calls executed via `fetchWithAuth` in `services/api.ts` automatically append the `Authorization: Bearer <token>` HTTP header.
4. **Session Expiry**: If any endpoint returns `HTTP 401 Unauthorized`, `api.ts` triggers the registered `authErrorCallback`, which clears the stored token, returns the user to `LoginScreen`, and displays a `Session Expired` warning toast.

---

## Remote Device Command Workflow

Since the web dashboard cannot directly query an Android phone's local `MediaStore`, commands are relayed asynchronously via the Ktor backend:

```
┌──────────┐                   ┌───────────┐                 ┌──────────┐
│ Dashboard│                   │  Backend  │                 │  Android │
└────┬─────┘                   └─────┬─────┘                 └────┬─────┘
     │                               │                            │
     │ 1. POST /api/devices/:id/cmds │                            │
     ├──────────────────────────────►│                            │
     │    { type: "LIST_MEDIA" }     │ 2. WebSocket Push          │
     │                               ├───────────────────────────►│
     │ 3. Poll Status (/commands/:id)│                            │ 4. MediaStore Query
     ├──────────────────────────────►│                            ├──────────────────┐
     │                               │                            │                  │
     │                               │ 5. Incoming Result         │◄─────────────────┘
     │                               │    { status: "ok" }        │
     │                               │◄───────────────────────────┤
     │ 6. Return Command Result      │                            │
     │◄──────────────────────────────┤                            │
```

### The `executeCommandAndPoll` Mechanism
In `services/api.ts`, remote operations use `executeCommandAndPoll<T>()`:
1. Dispatches `POST /api/devices/{deviceId}/commands` with command payload.
2. Polls `GET /api/devices/{deviceId}/commands/{cmdId}` every 800ms.
3. Automatically parses and returns the JSON result payload once the status transitions to `acked`.
4. Times out after 15 seconds if the phone is offline or unresponsive.

---

## Environment Configuration & API Proxying

In development, Vite proxies API requests to the local Ktor backend (default `http://localhost:8080`) as configured in `vite.config.ts`:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
});
```

To configure explicit production endpoints, create `.env.production`:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_WS_BASE_URL=wss://api.yourdomain.com
```

---

## Prerequisites & Installation

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation
```bash
cd gallery-dashboard
npm install
```

---

## Development & Build Commands

### Start Local Development Server
Runs the dashboard at `http://localhost:5173` with hot module replacement:
```bash
npm run dev
```

### Type Check & Production Build
Compiles TypeScript and outputs optimized production assets to `dist/`:
```bash
npm run build
```

### Preview Production Build
Locally serves the compiled `dist/` directory:
```bash
npm run preview
```

---

## Troubleshooting & Known Limitations

### 1. Command Polling Timeout
* **Symptom**: Toast warning "Command timed out waiting for device response."
* **Cause**: The target phone is offline or `GalleryConnectionService` foreground service is paused on the device.
* **Fix**: Ensure the device appears as `Online` in the device list.

### 2. File Download Staging Error
* **Symptom**: `PrepareDownloadWidget` reports error during file staging.
* **Cause**: Phone lacks battery or network capacity to upload full-resolution binary payload to staging directory.
* **Fix**: Check `gallery-backend` logs and ensure `STAGING_DIR` write permissions exist on the server.

### 3. Drag-and-Drop Limitations
* Browser security prevents remote write operations via simple drag-and-drop. File uploads from phone to dashboard use explicit prepare/poll transfer buttons.
