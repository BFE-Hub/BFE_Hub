# BFE_Hub

<div align="center">
  <img src ="icons/icon128.png" alt="BFE_Hub Logo" width="128" heigth="128" />
  <h1>BFE_Hub</h1>
</div>

**BFE_Hub** is a Chrome extension that automatically syncs your [BFE.dev](https://bigfrontend.dev) solutions to your GitHub repository. Focus on coding, and let BFE_Hub handle the version control.

## ✨ Features

- **Automatic Sync**: Automatically pushes your code to GitHub when you pass a problem.
- **Structured Organization**: Saves solutions in a structured format: `Category/Problem-Name/Problem-Name.js`.
- **Auto-Generated README**: Automatically creates a `README.md` file for each problem with the problem description.
- **GitHub OAuth Login**: Secure and easy sign-in with your GitHub account.
- **Custom Repository**: Choose an existing repository or create a new one to store your solutions.
- **Success Feedback**: Visual feedback (✅ checkmark) directly on the BFE.dev interface upon successful sync.

## 🚀 Installation

### From Chrome Web Store
*(Coming Soon)*

### Manual Installation (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/BFE-Hub/BFE_HUB.git
   ```
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked**.
5. Select the cloned directory.

## 📄 Usage

1. **Sign In**: Click the BFE_Hub extension icon and sign in with your GitHub account.
2. **Setup Repository**:
   - After signing in, you will be prompted to set a repository name (default suggestion: `bfe-solutions`).
   - Enter your desired repository name and click **"Save"**.
   - If the repository doesn't exist, BFE_Hub will automatically create it for you.
3. **Solve Problems**: Go to [BFE.dev](https://bigfrontend.dev) and solve a problem.
4. **Submit**: Click "Submit" on BFE.dev.
5. **Sync**: Once your solution passes, BFE_Hub will automatically upload your code and the problem description to your GitHub repository. You'll see a green checkmark ✅ next to the "Well Done!" message.

## 🛠 Project Structure

- `manifest.json`: Extension configuration (Manifest V3).
- `popup.html` / `popup.js`: Extension popup UI (Login, Repo Settings).
- `background.js`: Handles GitHub API interactions (Uploads).
- `inject.js`: Intercepts BFE.dev network requests to detect submissions.
- `content.js`: Bridges `inject.js` and `background.js`, handles UI updates.
- `bfehub-server/`: Vercel Serverless Function for secure OAuth token exchange.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## ☕ Support

If you find this tool helpful, consider buying me a coffee!

<a href="https://www.buymeacoffee.com/yminion" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="180" />
</a>
<br/>

---
<div align="center">
  <sub>Built with ❤️ for the BFE.dev community</sub>
</div>