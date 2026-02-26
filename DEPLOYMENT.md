# Offline CBT System - Deployment Guide

## 1. System Overview
This system consists of two parts:
1.  **Teacher App (Admin)**: A Progressive Web App (PWA) for creating exams and viewing results.
2.  **Student App (Runner)**: A single HTML file (`student.html`) that runs the exam on student devices.

## 2. Building the System
To generate the production files, run:
```bash
npm run build
```
This will create a `dist` folder with:
*   `dist/teacher/`: The Teacher App (upload to static host or run locally).
*   `dist/student/student.html`: The **Single File** Student App (copy to flash drives).

## 3. Teacher App Deployment
### Option A: Online Hosting (Recommended for Teachers)
Deploy the `dist/teacher` folder to any static host (Netlify, Vercel, GitHub Pages).
*   Teachers access it via URL.
*   It installs as a PWA for offline use.

### Option B: Offline Hosting
Serve the `dist/teacher` folder using a local web server (e.g., `http-server` or Chrome Web Server extension) on the teacher's laptop.

## 4. Student App Distribution (The "Sneaker-Net")
1.  **Prepare Flash Drives**: Format them as FAT32 or ExFAT (compatible with Chromebooks).
2.  **Copy the App**: Copy `dist/student/student.html` to the root of the flash drive.
3.  **Copy the Exam**:
    *   Teacher creates an exam in the Teacher App.
    *   Downloads the `.cbt` file (e.g., `MATH_101_SECURE.cbt`).
    *   Copies this file to the flash drive.

## 5. Running an Exam on Chromebooks
1.  **Insert Flash Drive**: Student plugs in the USB drive.
2.  **Open App**: Student double-clicks `student.html`. Chrome opens it.
3.  **Load Exam**:
    *   Student enters their Name/ID.
    *   Student enters the **Passcode** (written on whiteboard by teacher).
    *   Student clicks "Choose File" and selects the `.cbt` file from the USB drive.
4.  **Take Exam**:
    *   App goes fullscreen.
    *   Timer starts.
    *   **Anti-Cheat**: If student switches tabs, it is logged.
5.  **Submit**:
    *   Student clicks "Submit".
    *   App generates a result file (e.g., `RESULT_JohnDoe_MATH.json`).
    *   This file is automatically downloaded to the "Downloads" folder (or user selects USB).
    *   Student moves the file to the USB drive if not saved there directly.

## 6. Grading & Validation
1.  **Collect Drives**: Teacher collects all USB drives.
2.  **Open Teacher App**: Go to "View Results".
3.  **Enter Passcode**: Enter the same passcode used to encrypt the exam.
4.  **Import**: Select all `.json` result files from the USB drives.
5.  **Verify**:
    *   **Green Check**: Valid signature. Score is authentic.
    *   **Red X**: Tampered file. The student modified the JSON.
    *   **Yellow Alert**: Integrity flags (e.g., "Focus Lost 5 times").

## 7. Key Management Best Practices
*   **Passcodes**: Use strong passcodes (e.g., "SchoolName-Year-RandomWord").
*   **Secrecy**: Do not write the passcode on the board until the moment the exam starts.
*   **Rotation**: Use a different passcode for every exam file.

## 8. Troubleshooting
*   **"Invalid Passcode"**: Ensure the passcode matches exactly what was used to encrypt.
*   **"Tampered"**: The file was modified after submission. Reject the result.
*   **Chromebook Restrictions**: If `file://` access is blocked by policy, ask IT to whitelist local HTML files or host the `student.html` on a local school intranet IP.
