# Architecture Decision Record (ADR)

## ADR-001: Local-First Single-File Architecture

### Context
We are building a CBT system for Nigerian schools where internet access is unreliable or non-existent. Devices are often Chromebooks or low-end laptops. We need a system that is robust, secure enough for school exams, and requires zero IT maintenance.

### Decision
We will build a **Single-Page Application (SPA)** that compiles into a **Single HTML File**.

### Consequences
*   **Positive:**
    *   Runs completely offline.
    *   No server costs.
    *   Trivial distribution (copy/paste).
    *   Works on restricted devices that allow browser access but block software installation.
*   **Negative:**
    *   Updates require redistributing the file.
    *   Security is "client-side" (susceptible to advanced reverse engineering, though acceptable for this threat model).
    *   File size management (cannot include massive video assets easily).

## ADR-002: JSON-Based Data Storage

### Context
Without a database server, we need a way to store exams and results.

### Decision
We will use **JSON files** as the transport mechanism.
*   `exam.json`: Contains questions, settings, and encrypted answers.
*   `result.json`: Contains student metadata, answers chosen, score, and a cryptographic signature.

### Consequences
*   **Positive:**
    *   Human-readable (mostly).
    *   Universal support in JavaScript.
    *   Easy to backup and archive.
*   **Negative:**
    *   Manual file management for teachers (collecting files from USBs).
    *   Concurrency issues (cannot have 30 students write to one file simultaneously; they must write to their own files).

## ADR-003: Web Crypto API for Security

### Context
We need to prevent students from:
1.  Reading the answers from the exam file before the test.
2.  Modifying their score in the result file after the test.

### Decision
We will use the browser's native **Web Crypto API**.
*   **AES-GCM** for encrypting the exam content.
*   **HMAC-SHA256** for signing the result files.

### Consequences
*   **Positive:**
    *   Standard, high-security algorithms.
    *   Native performance (no heavy JS libraries).
    *   No key exchange required over network (keys derived from passwords or embedded).
*   **Negative:**
    *   If a student loses their password/key, data is unrecoverable.
    *   Complexity in implementation compared to simple obfuscation.
