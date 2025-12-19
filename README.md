# BFE_Hub

<div align="center">
  <img src ="icons/thumbnail_header.png" alt="BFE_Hub Logo" width="128" />
  <h1>BFE_Hub</h1>
  <p>Automatically sync your BFE.dev solutions to GitHub.</p>
</div>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license"/></a>
  <a href="https://chrome.google.com/webstore/detail/ajmpkjfgallagdphodjnmddomgaleahn"><img src="https://img.shields.io/chrome-web-store/v/ajmpkjfgallagdphodjnmddomgaleahn.svg" alt="chrome-webstore"/></a>
  <a href="https://chrome.google.com/webstore/detail/ajmpkjfgallagdphodjnmddomgaleahn"><img src="https://img.shields.io/chrome-web-store/d/ajmpkjfgallagdphodjnmddomgaleahn.svg" alt="users"></a>
  <br/>
  <b>🇺🇸 English</b> | <a href="README_KR.md">🇰🇷 한국어</a>
</p>

## Table of Contents

1. [Chrome Web Store](#download-from-chrome-web-store)
2. [What is BFE_Hub?](#what-is-bfe_hub)
3. [Installation & Setup](#installation--setup)
4. [How it Works](#how-it-works)
    1. [Workflow](#1-workflow)
    2. [Upload Timing](#2-upload-timing)
    3. [Saved Information](#3-saved-information)
5. [Links & Support](#links--support)

<br />

## Download from Chrome Web Store
Click the link below to install BFE_Hub directly from the Chrome Web Store!
<br/>
<br/>

<span>👉</span>
<a href="https://chrome.google.com/webstore/detail/ajmpkjfgallagdphodjnmddomgaleahn">
  <img src="icons/chrome_web_store_logo.svg" alt="Download from Chrome Web Store" width="200"/>
</a>

<br/>

<a href="https://chrome.google.com/webstore/detail/ajmpkjfgallagdphodjnmddomgaleahn">
  <img src="icons/webstore_image.png" alt="Available in the Chrome Web Store" width="100%"/>
</a>

<br />
<br />

## What is BFE_Hub?

**BFE_Hub** is a Chrome extension that automatically syncs your [BFE.dev](https://bigfrontend.dev) solutions to your GitHub repository. It allows you to build your frontend portfolio effortlessly while practicing for coding interviews.

This project is inspired by tools like LeetHub and BaekjoonHub, aiming to provide a seamless experience for the BFE.dev community.

## 🎥 Demo Video

[![BFE_Hub Demo Video](https://img.youtube.com/vi/Pten-5zfGG0/0.jpg)](https://www.youtube.com/watch?v=Pten-5zfGG0)

<br />

## Installation & Setup

1.  **Install** the extension from the [Chrome Web Store](https://chrome.google.com/webstore/detail/ajmpkjfgallagdphodjnmddomgaleahn).
2.  Click the extension icon and click the **"Sign in with GitHub"** button.
3.  Authorize the application to link your GitHub account.
4.  Once redirected, click the extension icon again to see the connection status.
5.  **Set Repository**: You will be prompted to set a repository name (e.g., `bfe-solutions`). Enter your desired name and click **"Save"**.
    *   If the repository doesn't exist, BFE_Hub will automatically create it for you.

<br />

## How it Works

### 1. Workflow

1.  Solve a problem on [BFE.dev](https://bigfrontend.dev).
2.  Click **Submit**.
3.  If your solution passes all test cases, BFE_Hub automatically:
    *   Fetches the problem description and your solution code.
    *   Commits them to your linked GitHub repository.
4.  You will see a green checkmark (✅) on the BFE.dev success modal confirming the sync.

### 2. Upload Timing

BFE_Hub triggers only when you successfully pass a problem after clicking "Submit". It does not upload failed attempts.

### 3. Saved Information

When a problem is solved, the following information is parsed and saved to your repository:

| Platform | Problem Metadata | User Submission |
| :--- | :--- | :--- |
| **BFE.dev** | - **Category** (e.g., JavaScript, React)<br>- **Problem Title**<br>- **Problem Link**<br>- **Problem Description** (in README.md) | - **Solution Code** (.js / .tsx)<br>- **README.md** |

<br />

## Links & Support

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/BFE-Hub/BFE_HUB/issues" title="Report a Bug">
          <img src="https://img.icons8.com/fluency/48/000000/bug.png" width="48" height="48" alt="Report Bug">
      </a><br/><sub><b>Report Bug</b></sub>
    </td>
    <td align="center">
      <a href="https://github.com/BFE-Hub/BFE_HUB" title="GitHub Repository">
        <img src="https://img.icons8.com/fluency/48/000000/github.png" width="48" height="48" alt="GitHub Repo">
      </a><br/><sub><b>GitHub Repo</b></sub>
    </td>
     <td align="center">
      <a href="https://www.buymeacoffee.com/yminion" title="Buy Me A Coffee">
        <img src="https://img.icons8.com/fluency/48/000000/coffee-to-go.png" width="48" height="48" alt="Support">
      </a><br/><sub><b>Support</b></sub>
    </td>
  </tr>
</table>

### ☕ Buy me a coffee

If you find this tool helpful, considering supporting the project!

<a href="https://www.buymeacoffee.com/yminion" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="180" />
</a>

<br/>

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---
<div align="center">
  <sub>Built with ❤️ for the BFE.dev community</sub>
</div>