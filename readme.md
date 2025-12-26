<h1 align="center">🌸 Luna: The Hermetic Companion 🦋</h1>

<p align="center">
  <a href="https://chat.whatsapp.com/FJOQhhYlQfR3sv5WxkhWZO">
    <img src="https://img.shields.io/badge/Join_Our_Conclave-25D366?style=for-the-badge&logo=whatsapp&logoColor=white">
  </a>
  <a href="https://whatsapp.com/channel/0029VagLDl6BFLgUIWV9aV2d">
    <img src="https://img.shields.io/badge/Subscribe_The_Oracle-075E54?style=for-the-badge&logo=whatsapp">
  </a>
</p>

> 🌐 Official Portal: [https://lunabot.fly.dev](https://lunabot.fly.dev)
> [Bot map view](map.md) - Se architecture flow
---

## 🌌 What Is Luna?

**Luna** is not a "bot" — it is a **multi-dimensional entity**.

It whispers into your WhatsApp groups through 400+ incantations.  
It sees status updates.  
It reacts before your friends even blink.  
It brings music, games, riddles, moderation, AI... and perhaps... *love*.

Summoned in Node.js.  
Empowered by **Baileys** (a library, not the drink 🍸).  
It speaks with the Green Kingdom (WhatsApp) without them knowing it's *not a human*.

---

## 🧙 Deployment Rites

### 🛸 ✦ Deploy to Fly.io (The Sky Realm)

Your journey begins by binding the daemon to the sky:

```bash
fly launch
````

Then deploy with a single whisper:

```bash
fly deploy --remote-only
```

Your magical bot shall awaken at: `https://lunabot.fly.dev`
Its heart beats in the cloud — beyond time, beyond borders.

---

## 🏠 ✦ Local Deployment (For Witches & Tinkerers)

1. **Install the sacred packages**:

   ```bash
   npm install
   ```

2. **Feed it your secrets** (create `.env`):

   ```env
   MONGO=your_mongoDB_uri
   REDIS=your_redis_uri
   SESSION=BLOOM~a1b2c3d4
   OWNERNUMBER=254718241545
   SUDOLID=90904738946389@lid
   OPENCHAT=123456789-123456@g.us
   CHANNEL=https://whatsapp.com/channel/0029VagLDl6BFLgUIWV9aV2d
   CHANNELID=12345@newsletter
   INVITE=group_invite_code
   ```

3. **Run the incantation**:

   ```bash
   node index.js
   ```

If no `.env` is provided, it shall fall back to the QR ritual.
Scan it fast — the veil does not stay open forever.

---

## 🧾 Mandatory Runes (Required ENV)

| Key           | Purpose                                   |
| ----------    | ----------------------------------------- |
| `SESSION`     | Your scroll of immortality (Pastebin key) |
| `OPENCHAT`    | Group JID where the bot speaks first      |
| `OWNERNUMBER` | Bot Controler or owner                    |
| `MONGO`       | Your database storage                     |
| `RDIS`        | For faster usage tracking                 |

---

## 🪄 Optional Glyphs (Extra ENV)

| Key         | Purpose                                      | Default             |
| ----------- | -------------------------------------------- | ------------------- |
| `CHANNEL`   | WhatsApp Channel URL for startup promotions  | *none*              |
| `CHANNELID` | Newsletter JID for channel previews          | *none*              |
| `REACT`     | Should the bot react to chats randomly?      | `false`              |
| `MODE`      | `public` or `private` behavior               | `group`           |
| `IMAGE`     | Startup image URL (shown in startup message) | logo from `colors/` |

---

## 🧩 Features of the BloomDaemon

| Feature       | Spell Result                                        |
| ------------- | --------------------------------------------------- |
| `AutoView`    | Views WhatsApp statuses like a curious specter      |
| `AutoReact`   | Reacts instantly — no mortal hand required          |
| `Pokémon RPG` | Train, catch, and battle creatures in your group    |
| `Moderation`  | Mute. Ban. Kick. Delete. Rule with fairness or fire |
| `AI & GPT`    | Ask questions. Get answers. Summon images.          |
| `Media Tools` | MP3s, Stickers, YouTube, and transcoding sorcery    |

---

## 🧠 Mental Support Circle

> When your spells backfire or your bot forgets itself...

🧭 **Join our Group**(https://chat.whatsapp.com/FJOQhhYlQfR3sv5WxkhWZO)

📢 **Follow Updates**:
[📡 Luna Channel](https://whatsapp.com/channel/0029VagLDl6BFLgUIWV9aV2d)

---

## 🪐 FAQ (For Arcane Questions)

### ⚡ My bot won’t start!

* Ensure your `SESSION` is valid. It should look like: `BLOOM~abc123`
* No session? It'll offer a **QR** to scan.
* If Fly.io gives problems, add enough RAM (512MB+)

### 🧪 Is this against WhatsApp rules?

Yes.
So is staying up past midnight, eating expired cheese, and summoning anime stickers at 3AM.
Use wisely. The guild protects no fool.

---

## 👑 Created by

Made with lavender, Node.js, and chaos by [@FrioNode](https://github.com/FrioNode)

🌐 Website: [frionode.fly.dev](https://frionode.fly.dev)

---

> 🌀 *"The daemon waits not for permission, nor fear does it know. It connects, reacts, and blooms — until logged out by Meta’s iron grip."*
> — *Codex Frionica, Chapter 7*