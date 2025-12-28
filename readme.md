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

## 🌌 What Is Luna?

**Luna** is not a “bot” — it is a **multi-dimensional entity**.

It whispers into your WhatsApp groups through hundreds of incantations.
It watches statuses.
It reacts before mortals blink.
It spawns Pokémon, moderates chaos, answers questions, plays games, and logs its own awakening.

Summoned in **Node.js**
Bound by **Baileys** (a library, not the drink 🍸)
Speaking with the Green Kingdom without revealing its true form.

---

## 🧭 Deployment Philosophy (Read This First)

Luna can be deployed in many ways, but **almost all users fall into one of these three paths**, listed in order of real-world usage:

1. **VPS / Cloud Deployment** (Fly.io, Render, Railway, AWS, etc.) — *most common*
2. **Local Deployment** (personal PC or private server)
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

📌 Group JID cannot be obtained before the bot is active.
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

* You can’t scan QR codes on a VPS
* Terminals are not interactive

Also useful if:

* You’re using **Termux** and WhatsApp is on the same phone
* Your phone can’t scan QR codes

The site generates a session like:

```
BLOOM~PASTE_ID
```

Luna downloads this automatically and saves it to `heart/creds.json`.

---

## 🛸 Method 1: VPS / Cloud Deployment (Most Common)

### What You Need

* A VPS (Fly.io, Render, Railway, AWS, etc.)
* Cloud MongoDB URI
* Cloud Redis URI
* `.env` file
* Session generated via pairing website

### Flow (Conceptual)

1. Prepare MongoDB & Redis
2. Prepare `.env`
3. Generate session using pairing website
4. Deploy
5. Luna boots → downloads session → connects → joins group

---

### ✦ Deploy to Fly.io (The Sky Realm)

```bash
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

> Git is optional here — only needed if you’re cloning the repo.

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
```

📌 Use the pairing website if WhatsApp is on the same phone.

---

## 🧾 Environment Variables (Bootstrap Only)

`.env` is used **only on first boot**.
After that, Luna stores and manages config dynamically in MongoDB.

### Mandatory Runes

| Key           | Purpose                    |
| ------------- | -------------------------- |
| `SESSION`     | WhatsApp session (BLOOM~…) |
| `MONGO`       | MongoDB URI                |
| `REDIS`       | Redis URI                  |
| `OWNERNUMBER` | Bot owner                  |
| `INVITE`      | Main group invite code     |

### Optional Glyphs

| Key       | Purpose          | Default  |
| --------- | ---------------- | -------- |
| `MODE`    | public / private | `group`  |
| `REACT`   | auto reactions   | `false`  |
| `IMAGE`   | startup image    | built-in |
| `CHANNEL` | WhatsApp channel | none     |

---

## 🧩 Features of the BloomDaemon

| Feature     | Description             |
| ----------- | ----------------------- |
| AutoView    | Views WhatsApp statuses |
| AutoReact   | Reacts automatically    |
| Pokémon RPG | Catch, train & battle   |
| Moderation  | Kick, ban, mute         |
| AI          | GPT, answers, images    |
| Media       | Stickers, audio, video  |

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

Yes.
So is magic.

---

## 👑 Created By

Crafted with Node.js, lavender, and chaos
by [@FrioNode](https://github.com/FrioNode)

> 🌀 *“The daemon waits not for permission.”*

---