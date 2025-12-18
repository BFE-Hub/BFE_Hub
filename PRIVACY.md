# Privacy Policy for BFE_Hub

**Last Updated:** December 17, 2025

BFE_Hub ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how our Chrome Extension collects, uses, and safeguards your information.

## 1. Information We Collect

BFE_Hub collects and processes the following information **locally on your device**:

*   **GitHub Access Token**: obtained via OAuth 2.0 authentication to interact with the GitHub API on your behalf.
*   **User Preferences**: settings such as your preferred repository name.
*   **Problem Data**: code solutions and problem descriptions from BFE.dev.

 **We do NOT store any of your personal data on our own servers.** All data is stored locally in your browser using the Chrome Storage API.

## 2. How We Use Your Information

We use the collected information for the sole purpose of providing the extension's functionality:

*   To authentication you with GitHub.
*   To create a repository or upload files (your code solutions) to your GitHub account.
*   To save your extension configuration.

## 3. Data Sharing and Disclosure

We do **not** sell, trade, or otherwise transfer your personal information to outside parties.

*   **GitHub API**: The extension communicates directly with the GitHub API to perform file uploads. Your Access Token is sent only to GitHub's secure endpoints (`https://api.github.com`).
*   **Vercel Relay**: A stateless serverless function is used solely for the initial OAuth token exchange (exchanging the temporary code for an access token). This server does not log or store your Access Token or personal details.

## 4. Permissions

BFE_Hub requires the following permissions to function:

*   **`identity`**: To initiate the secure OAuth login flow with GitHub.
*   **`storage`**: To store your access token and settings locally so you don't have to log in every time.
*   **`activeTab` / Host Permissions (`bigfrontend.dev`)**: To detect when you have successfully solved a problem and to read the solution code from the page.

## 5. Security

We implement appropriate security measures to maintain the safety of your personal information. Your GitHub Access Token is stored securely in your browser's local storage and is never exposed to third parties other than GitHub itself.

## 6. Contact Us

If you have any questions regarding this privacy policy, you may contact us via our GitHub Repository: [https://github.com/BFE-Hub/BFE_HUB](https://github.com/BFE-Hub/BFE_HUB).
