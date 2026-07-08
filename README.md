# 🕶️ ShadowChat — Real-Time Chat & Video Call App

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-blue)](https://socket.io/)

**ShadowChat** is a secure, lightweight, and anonymous real-time chat & video communication platform built with **Node.js**, **Express**, and **Socket.IO**.  
It supports **text messaging** with typing indicators and seen receipts, **voice notes**, **media sharing** (images, videos, PDFs), and **peer-to-peer video calls** using WebRTC. Rooms are ephemeral and limited to 2 users for privacy-focused, one-on-one conversations—no persistent data or user accounts required.

The client-side is built with vanilla HTML, CSS, and JavaScript for a simple, framework-free experience.

---

## 🚀 Features

- 💬 Real-time one-to-one text chat with typing indicators, timestamps, and "seen" status
- 📞 Peer-to-peer **video & audio calls** using WebRTC (with mute/unmute controls)  
- 🎙️ Record and send **voice notes** directly in-browser  
- 🖼️ Share **images, videos, PDFs**, and other media (up to 50MB)  
- 🧠 Dynamic **room management** with random UUID or custom room IDs (shareable links)  
- 🔒 Configurable **CORS** for secure signaling; no authentication needed for anonymity  
- ⚡ Lightweight **Express + Socket.IO backend** for real-time events  
- 🗂️ Static serving for uploaded media files  

---

## 🛠️ Tech Stack

| Component               | Technology                   |
|-------------------------|------------------------------|
| Backend Framework       | **Express.js**               |
| Real-time Communication | **Socket.IO**                |
| Video / Voice Calls     | **WebRTC (Peer-to-Peer)**    |
| File Uploads            | **Multer**                   |
| Server                  | **Node.js**                  |
| Client-Side             | **Vanilla HTML/CSS/JS**      |
| Storage                 | Local `/Uploads` folder      |

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/sanusharma-ui/Chat.git
cd Chat
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Environment Variables (Optional for Development, Required for Production)
Create a `.env` file in the root directory:

```
PORT=3000
ALLOWED_ORIGIN=https://shadowchat-3.onrender.com  # Set to your frontend domain for CORS security
```

### 4️⃣ Run the Server
```bash
node server.js
```

For development with auto-reload (install nodemon globally if needed: `npm install -g nodemon`):
```bash
nodemon server.js
```

The server will start on `http://localhost:3000` (or your specified PORT). Open the URL in your browser to access the frontend (served from `/public`).

### 5️⃣ Project Structure
```
Chat/
├── server.js                # Express & Socket.IO backend logic
├── public/                  # Frontend static files (index.html, styles.css, client.js)
├── Uploads/
│   ├── voice_notes/         # Uploaded voice messages (auto-created)
│   └── media/               # Uploaded images, videos, PDFs (auto-created)
├── package.json
├── .env                     # Environment variables (gitignore this)
└── README.md
```

---

## 🧩 Socket.IO Events
| Event                  | Description |
|------------------------|-------------|
| `partnerId`            | Receives partner's socket ID |
| `paired`               | Notifies when room has 2 users |
| `waiting`              | Waiting for partner to join |
| `message`              | Real-time chat message |
| `fileMessage`          | Broadcast uploaded media or voice note |
| `messageSeen`          | Indicates partner has seen a message |
| `typing`               | Partner is typing indicator |
| `webrtc-offer`         | Sends WebRTC offer to partner |
| `webrtc-answer`        | Sends WebRTC answer |
| `webrtc-ice-candidate` | ICE candidate exchange |
| `partnerLeft`          | Notifies that partner disconnected |

## 🎯 API Endpoints
| Method | Endpoint             | Description |
|--------|----------------------|-------------|
| POST   | `/create-room`       | Create custom room (body: { roomId }) |
| GET    | `/create-room`       | Create random room |
| POST   | `/upload-voice-note` | Upload voice notes (multipart form) |
| POST   | `/upload-media`      | Upload images, videos, PDFs (multipart form) |
| GET    | `/uploads/*`         | Serve uploaded files statically |

---

## 💡 Usage Tips
- **Create/Join Rooms**: Use the frontend to generate/share room links. Rooms auto-clean when empty.
- **Video Calls**: Requires camera/mic permissions. Uses Google's public STUN servers (add TURN for production).
- **Media Limits**: Voice notes up to 15MB; media up to 50MB. Files are stored locally—consider cloud storage for scale.
- **Deployment**: Host on Render, Heroku, or Vercel. Set `ALLOWED_ORIGIN` to your domain. For HTTPS, ensure WebRTC works over secure connections.
- **Browser Support**: Best on Chrome/Firefox. Test WebRTC and MediaRecorder APIs.

## 🔍 Limitations & Future Enhancements
- **Current Limits**: In-memory room tracking (no DB); files persist on disk (add cleanup jobs).
- **Security**: Rooms are guessable—add passwords for sensitive use.
- ✅ Group chat & multi-user rooms
- 🔐 JWT or session-based authentication
- ☁️ Integrate cloud storage (e.g., AWS S3)
- 🧠 AI-powered features (e.g., moderation, summaries)
- 📱 Mobile-friendly React/Vue frontend

---

## 💖 Author
👨‍💻 **Sanu Sharma**  
🚀 IT Engineer | AI & Web Development Enthusiast  

## 🪄 License
This project is licensed under the [MIT License](LICENSE).

“ShadowChat — Because real conversations deserve real connection.” 🖤