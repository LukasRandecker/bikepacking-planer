# Bikepacking Projekt – Server & Frontend

Dieses Projekt besteht aus einem **Node.js/Express-Server** mit **MongoDB** und einem **Frontend (React)** für die Verwaltung von Bikepacking-Touren, Setups und Items.

## Voraussetzungen

- **Node.js** (>=18.x)
- **npm** (>=9.x)
- **MongoDB** lokal installiert oder MongoDB Atlas Account
- Optional: **MongoDB Compass** zum Anschauen der Datenbank

## Installation

### 1. Server Setup

```bash
# In den Server-Ordner wechseln
cd Server

# Node-Module installieren
npm install

# Nodemon global installieren (optional, für automatischen Neustart bei Änderungen)
npm install -g nodemon
```

### 2. Frontend Setup

```bash
# In den Frontend/Bikepacking-Ordner wechseln
cd Frontend/Bikepacking

# Node-Module installieren
npm install react-router-dom
npm install axios
npm install @reduxjs/toolkit react-redux
npm install tailwindcss @tailwindcss/vite
npm install xmldom
npm install jspdf jspdf-autotable
```

## Server starten

1. Stelle sicher, dass **MongoDB** läuft (`mongod`).
2. Server starten mit nodemon:

    ```bash
    nodemon app.js 
    ```

3. Der Server läuft dann unter: [http://localhost:3030](http://localhost:3030)
4. Swagger-Dokumentation: [http://localhost:3030/docs](http://localhost:3030/docs)

## Frontend starten

```bash
# Im Frontend-Ordner
npm run dev
```

Das Frontend läuft dann standardmäßig unter: [http://localhost:5173](http://localhost:5173)
