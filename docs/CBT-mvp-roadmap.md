# Offline CBT System - MVP Roadmap & Architecture

## 1. Project Overview
The **Offline Computer-Based Testing (CBT) System** is a secure, browser-based examination platform designed for primary and secondary schools with limited or no internet access. It runs entirely on client devices (specifically Chromebooks) and uses physical media (flash drives) for data distribution.

**Goal:** Enable schools to conduct digital exams without servers, internet, or expensive infrastructure.

## 2. Core Architectural Decisions

### A. Serverless & Database-less
*   **Decision:** We are not using a traditional backend (Node/Python/PHP) or a database (MySQL/PostgreSQL).
*   **Reasoning:** Schools often lack reliable internet and IT infrastructure to maintain servers.
*   **Implementation:** The browser is the runtime. The file system (via USB) is the database.

### B. Single-File Deployment
*   **Decision:** The entire application (HTML, CSS, JS, Assets) will be bundled into a single `.html` file.
*   **Reasoning:**
    *   **Zero Install:** No setup required on school devices.
    *   **Sandboxing:** Bypasses strict browser security policies regarding local file access (CORS) that occur when splitting files.
    *   **Portability:** Easy to copy/paste across hundreds of flash drives.

### C. "Sneaker-Net" Data Transport
*   **Decision:** Data moves physically via USB drives.
*   **Flow:**
    1.  **Teacher:** Generates `exam.json` (encrypted).
    2.  **Transfer:** Saves to USB.
    3.  **Student:** Loads `exam.json` from USB into the App.
    4.  **Student:** Takes exam -> App generates `result.json` (signed).
    5.  **Transfer:** Saves result to USB.
    6.  **Teacher:** Loads results from USB to aggregate scores.

## 3. Security Strategy (MVP Level)

Since the code runs on the client, we cannot prevent 100% of attacks from determined hackers. However, we can prevent **casual cheating** effectively.

*   **Encryption:** Question data in `exam.json` will be encrypted using **AES-GCM** (via Web Crypto API). A password (provided by the teacher in class) is required to decrypt and start the exam.
*   **Integrity:** Result files will be signed using **HMAC-SHA256**. If a student edits their score in the text file, the signature will fail validation.
*   **Obfuscation:** Answer keys are not stored in plain text.
*   **Environment:** We will use the Fullscreen API and visibility change detection to discourage tab switching.

## 4. Tech Stack

*   **Frontend Framework:** React 19 (for robust state management).
*   **Build Tool:** Vite (fast development).
*   **Bundling:** `vite-plugin-singlefile` (to inline everything).
*   **Styling:** Tailwind CSS v4 (utility-first, inlined).
*   **Icons:** Lucide-React.
*   **Storage:** `localStorage` (for crash recovery during the exam).

## 5. MVP Feature Roadmap

### Phase 1: Foundation (Completed)
- [x] Project Setup (Vite + React + Tailwind).
- [x] Single-File Build Configuration.
- [x] Basic "Exam Taker" UI Layout.

### Phase 2: The Exam Engine (Completed)
- [x] JSON Data Structure Definition (`Exam` vs `Attempt`).
- [x] File Loader (Drag & Drop `exam.json`).
- [x] Question Renderer (Multiple Choice).
- [x] Navigation (Next/Prev).
- [x] Timer Implementation.
- [x] Review/Flagging Mechanism.

### Phase 3: Security & Persistence (Completed)
- [x] Web Crypto Implementation (Encrypt/Decrypt logic).
- [x] Result Generation & Download (Signed).
- [x] Auto-save to `localStorage` (Critical for crash recovery).

### Phase 4: Teacher Tools (Admin) (Completed)
- [x] Simple Form to create Questions.
- [x] "Export Exam" functionality (Encrypted .cbt).
- [x] "Import Results" functionality (Grading View & Verification).
- [x] Export Results to CSV.
- [x] Support for True/False & Short Answer UI.

## 6. What Works (Status)
*   **Core Loop:** The entire flow from creating an exam, encrypting it, taking it offline, signing the result, and verifying it in the admin app is **fully functional**.
*   **Security:** AES-256-GCM encryption and HMAC-SHA256 signing are implemented and working.
*   **Deployment:** The build system correctly generates the single-file student runner and the teacher PWA.
*   **Resilience:** Auto-save and crash recovery are implemented.
*   **Flexibility:** Multiple question types (MCQ, True/False, Short Answer) are supported.
*   **Usability:** Improved UI with clear instructions and review features.

## 7. Deployment Strategy (Hybrid Model)

This architecture supports both **fully offline** and **web-hosted** scenarios.

### A. Web Hosted (Netlify/Vercel)
*   **Teacher Dashboard:** Accessible at `https://your-app.com/`.
*   **Student App:** Accessible at `https://your-app.com/student.html`.
*   **Workflow:**
    1.  Teacher logs in online to create exams.
    2.  Teacher downloads the `.cbt` exam file.
    3.  Teacher clicks **"Get Student App"** to download `student.html` for offline students.

### B. Fully Offline (Flash Drive)
*   **Teacher:** Runs the dashboard locally (if built as a desktop app or local server, though web-hosted is preferred for creation).
*   **Student:** Runs `student.html` directly from the flash drive.

### Build Output (`dist/`)
*   `index.html` -> Teacher Dashboard (PWA).
*   `student.html` -> Student Console (Single-File App).
*   `assets/` -> Scripts and styles for the Dashboard.

---
*Last Updated: 2026-02-26*
