<h1 align="center">🌸 Luna: The Hermetic Companion 🦋</h1>

<p align="center">
  <a href="https://chat.whatsapp.com/Eqa4MEPkmxwFwMCPX3pt4I">
    <img src="https://img.shields.io/badge/Join_Our_Conclave-25D366?style=for-the-badge&logo=whatsapp&logoColor=white">
  </a>
  <a href="https://whatsapp.com/channel/0029VagLDl6BFLgUIWV9aV2d">
    <img src="https://img.shields.io/badge/Subscribe_The_Oracle-075E54?style=for-the-badge&logo=whatsapp">
  </a>
</p>

> 🌐 Official Portal: [https://lunabot.fly.dev](https://lunabot.fly.dev)
> 🗺️ [Bot map view](bloom/map.md) — see architecture flow

---

## 🌌 What Is Luna? (spanish word for moon)

**Luna** is not a “bot” — it is a **multi-dimensional entity from the galaxy**.

It whispers into your WhatsApp groups through hundreds of incantations, watches statuses, reacts before mortals blink, spawns Pokémon, moderates chaos, answers questions, plays games, and logs its own awakening. Those are the features 🧩 of the LunaDaemon

Summoned in **Node.js** Bound by **Baileys** (a library, not the drink 🍸)
Speaking with the Green Kingdom without revealing its true form.

---

## 🧭 Deployment Philosophy (Read This First)

Luna can be deployed in many ways, but **almost all users fall into one of these three paths**, listed in order of real-world usage:

1. **VPS / Cloud Deployment** (Fly.io, Render, Railway, AWS, etc.) — *most common*
2. **Local Deployment** (personal PC or private server / termux)
3. **Docker Deployment** (controlled environments, Fly.io, self-hosted servers)

> ⚠️ **Windows is not recommended**
> Luna has never been officially tested on Windows. It *may* work (especially under WSL), but Linux-based environments are strongly recommended.

---

## 🧾 Before You Summon Luna

Do **not** skip this section. Luna is stateful and service-backed.

### 1️⃣ MongoDB (Required)

Luna uses MongoDB for:

* Persistent configuration
* Dynamic settings (`setup.js`)
* Runtime state

**VPS / Cloud**

* Use a managed MongoDB (Atlas, Railway, etc.)
* Local MongoDB on VPS is **not recommended**

**Local Deployment**

* You may use:

  * Cloud MongoDB (recommended)
  * OR self-host MongoDB on your machine/server

---

### 2️⃣ Redis (Strongly Recommended)

Redis improves:

* Performance
* Stability
* Caching & usage tracking

**VPS**

* Use a managed Redis (Upstash preferred)

**Local**

* Cloud Redis or self-hosted Redis both work

---

### 3️⃣ WhatsApp Group (Important)

Luna is also a **gaming bot**.

You need at least **one WhatsApp group** where:

* Pokémon spawn
* Logs & startup messages are sent
* Core gameplay happens

From this group, Luna uses:

| Item              | Required   | Notes                          |
| ----------------- | ---------- | ------------------------------ |
| Group Invite Code | ✅ Yes      | Used to auto-join on boot      |
| Group JID         | ❌ Optional | Can be set after bot is online |

📌 Group JID helps the bot know where to spawn pokemons and send logs too, it cannot be obtained before the bot is active.
You can update it later — Luna stores configs in MongoDB dynamically.

---

## 🧙 Session & Authentication (Context Matters)

Luna supports **two authentication paths**.
Which one you use depends on *where* you deploy.

---

### 🔮 QR Ritual (Local / Terminal-Based)

Best for:

* Local Linux servers
* Development machines

When you start Luna locally **without a session**, it will:

* Generate a QR code in the terminal
* Let you scan and authenticate normally

No external tools required.

---

### 🌐 Pairing Website (Cloud / Special Cases)

👉 [https://lunaconnect.onrender.com/](https://lunaconnect.onrender.com/)

This is **NOT mandatory**, but **required for VPS/cloud deployments** because:

* You can’t scan QR codes on most VPS
* Terminals are not interactive

Also useful if:

* You’re using **Termux** and WhatsApp is on the same phone
* Your phone can’t scan QR codes or
* You just want to use it, no offence

📦 Session Output (Use Only One)

When you pair using the website, the paired WhatsApp account receives the session data directly as messages to itself.
Check your chats — usually the first unpinned chat — to find:

Your session info (BLOOM~paste_id , creds.json) and a short video guide showing how to use it

Important: Use only one session method — never both.

1️⃣ BLOOM~paste_id (Recommended for VPS / Cloud)

Add this value to your .env file: Most VPS allow you to manage variables on a friendly UI

```SESSION=BLOOM~paste_id```

On boot, Luna automatically downloads the session and saves it internally to:

heart/creds.json

2️⃣ creds.json File (Local Only)

The `creds.json` file from the pairing site (check your own chat as above)

Manually create the folder: heart/ and place the file inside.

Note: This method is only for local deployments or maybe when your VPS support file upload.

## 🛸 Method 1: VPS / Cloud Deployment (Most Common)

### What You Need

* A VPS (Fly.io, Render, Railway, Heroku, AWS etc.)
* Cloud MongoDB URI
* Cloud Redis URI
* Session generated via pairing website

Most of these VPS have good UI but they also offer CLI tools (one example below)

---

### ✦ Deploy to Fly.io (The Sky Realm)

You need to creat an account on this world [https://fly.io](https://fly.io).
Read documentaion oh how to install & use `flyctl` here 👉🏽 [https://fly.io/docs/flyctl/install/](https://fly.io/docs/flyctl/install/) below are quick commands to get you started.

```bash
fly login
fly launch
fly deploy --remote-only
```

Your daemon awakens beyond borders.

---

## 🏠 Method 2: Local Deployment (For Witches & Tinkerers)

### Requirements

* Linux system (or WSL)
* Node.js v18+
* FFmpeg
* MongoDB (cloud or local)
* Redis (cloud or local)

> Git is optional here — only needed if you’re cloning the repo. (some socceres downloads as zip)

### Install Dependencies

```bash
npm install
# or (recommended on WSL/local)
pnpm install
```

### Start the Bot

```bash
node luna.js
```

If no session exists, Luna will open the **QR ritual** automatically.

Optional (recommended):

```bash
pm2 start luna.js --name luna
pm2 logs
```

---

## 🐳 Method 3: Docker Deployment

Luna already ships with:

* `Dockerfile`
* `docker-compose.yml`

You **do not need to create one**.

### Default Usage

```bash
docker-compose up -d
```

Modify `docker-compose.yml` **only if**:

* You need custom ports
* You want to attach Mongo/Redis containers
* You’re in a controlled VPS environment

---

## 📱 Termux Users (Special Case)

Termux behaves like a local deployment, with limitations.

### Recommended Setup

* Node.js
* FFmpeg
* **Yarn** (strongly recommended)

```bash
yarn install
node luna.js
# termux supports pm2 as well
```

📌 Use the pairing website if WhatsApp is on the same phone.

---

## 🧾 Environment Variables (Bootstrap Only)

`.env` is used **only on first boot**.
After that, Luna stores and manages config dynamically in MongoDB.

### Mandatory Runes

| Key           | Purpose                |
| ------------- | ---------------------- |
| `SESSION`     | authentication         |
| `MONGO`       | MongoDB URI            |
| `REDIS`       | Redis URI              |
| `OWNERNUMBER` | Bot owner              |
| `INVITE`      | Main group invite code |

### Optional Glyphs

Most environment variables are **optional** and only enable extra features.  
Luna runs with minimal configuration; API keys are required **only if you want those features**.

- `MODE` — Controls whether the bot runs in `public` or `private` mode (default: `group`)
- `REACT` — Enables or disables automatic reactions (default: `false`)
- `IMAGE` — Custom startup image (default: built-in)
- `CHANNEL` — Optional WhatsApp channel ID for announcements

### Optional External APIs

- `NINJAKEY` — Used by Ninja APIs  
  Get it from: https://api-ninjas.com/

- `WEATHERKEY` — Used to fetch weather data  
  Get it from: https://openweathermap.org/api

📌 **Note:** There are many other environment variables, but **most are optional** and only required for specific features.

---

## 🧠 Mental Support Circle

🧭 Group: [https://chat.whatsapp.com/FJOQhhYlQfR3sv5WxkhWZO](https://chat.whatsapp.com/FJOQhhYlQfR3sv5WxkhWZO)
📢 Channel: [https://whatsapp.com/channel/0029VagLDl6BFLgUIWV9aV2d](https://whatsapp.com/channel/0029VagLDl6BFLgUIWV9aV2d)

---

## 🪐 FAQ

### ⚡ Bot won’t start?

* Check Mongo & Redis
* Session must look like `BLOOM~xxxx`
* VPS users must generate session **before boot**

### 🧪 Is this against WhatsApp rules?

Yes and So is magic.

---

## 👑 A Creation of love & caffein

Crafted with Node.js, lavender, and chaos
by [@FrioNode](https://github.com/FrioNode)


> 🌀 *"The daemon waits not for permission, nor fear does it know. It connects, reacts, and blooms — until logged out by Meta’s iron grip."*
> — *Codex Frionica, Chapter 7*

---