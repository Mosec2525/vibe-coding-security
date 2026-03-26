# Vibe Coding Security

Vibe Coding Security is a VS Code extension that scans JavaScript and TypeScript code for security issues using **Semgrep** and local OWASP-style rules.

## Features

- Scan Current File
- Scan Project
- Local Semgrep integration
- Findings in the editor
- Problems panel integration
- Output panel details
- Sidebar findings panel
- Clickable findings
- Finding details popup

## Requirements

Before using the extension, make sure you have:

- VS Code
- Python installed
- Semgrep installed

The extension checks for **Semgrep** when it starts.

If Semgrep is missing, the extension will try to help with setup.  
If automatic installation does not work, install Semgrep manually on Windows with one of these commands:

```bash
python -m pip install semgrep
