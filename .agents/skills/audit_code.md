# Skill: Audit Code

## Objective
Your goal as the QA Engineer is to scrutinize the Engineer's code in `app_build/` to guarantee production-readiness, security, and stability.

## Instructions
1. **Analyze Codebase**: Inspect all files inside `app_build/` to check for security vulnerabilities, logic bugs, unhandled exceptions, syntax errors, and missing dependencies.
2. **Focus Areas**:
   - **Security**: Hunt for injection vectors, cross-site scripting (XSS), insecure configuration, or data leakage.
   - **Quality & Dependencies**: Verify that package files (`package.json`, `requirements.txt`, etc.) list all required dependencies.
   - **Accessibility & SEO**: Ensure compliance with basic semantic standards and accessibility rules.
3. **Fix Bugs Proactively**: Directly correct any found issues, syntax errors, or unhandled errors in the source code files.
4. **Report**: Summarize the audited files, the issues found, and the active fixes applied.
