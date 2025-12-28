```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Bot as Luna Bot
    participant Config as Config Loader
    participant Mongo as MongoDB
    participant Redis as Redis Cache
    participant Baileys as Baileys Socket
    participant Games as Game Engine
    participant Dashboard as Dashboard/Express
    participant Storage as Persistent Storage

    %% Initialization
    Bot->>Config: Load environment configs
    Bot->>Mongo: Connect to database
    Bot->>Redis: Connect to cache
    Bot->>Storage: Load session/credentials
    Bot->>Baileys: Start Baileys socket
    Baileys->>User: Listen for QR login (if needed)
    Baileys->>Bot: Handle login/reconnect

    %% Event Handling
    User->>Baileys: Send message
    Baileys->>Bot: Process message upsert
    Bot->>Bot: Execute command processing
    Bot->>User: Auto react to message (optional)

    %% Command Modules
    User->>Bot: Trigger owner/user/game/economy commands
    Bot->>Games: Execute Tic Tac Toe / Pokemon
    Bot->>Bot: Update economy/magic wand

    %% Utilities & Dashboard
    Bot->>Bot: Reminder checker
    Bot->>Bot: Status watcher
    Bot->>Dashboard: Serve web dashboard
    Dashboard->>Storage: Read/write stored messages