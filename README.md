# Verasanti - Professional Headshots

## Setup Instructions

### 1. API Key
This application requires a Google Gemini API Key.

**In CodeSandbox:**
1. Create a file named `.env` in the root directory.
2. Add the following line:
   ```
   API_KEY=AIzaSy...YourKeyHere
   ```
3. Restart the dev server terminal.

**Alternatively:**
1. Use the "Env" or "Secrets" tab in the CodeSandbox sidebar.
2. Add a secret with Name: `API_KEY` and your value.
3. Restart the sandbox.

### 2. Troubleshooting
If you see "Package not found", verify `package.json` is using a valid version of `@google/genai` (e.g. `^0.1.2`) and restart the container.