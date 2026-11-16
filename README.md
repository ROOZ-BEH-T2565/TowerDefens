# Tower Defense 3D / دفاع از برج سه‌بعدی

Pure HTML + ES modules + Three.js (loaded from a CDN). No build step, no npm packages, no external assets.

## Run / اجرا
**Easiest (also needed for multiplayer):**
```
node server/server.js        # or: npm start, start.sh (Linux/macOS), start.bat (Windows)
```
Open `http://localhost:8080`. The console also prints the addresses other devices can use.

Single player only (no Node): serve the folder with any static server, e.g. `python3 -m http.server 8000`
(opening `index.html` directly from disk does not work: browsers block ES modules on `file://`).
An internet connection is needed once for Three.js and the Vazirmatn font (CDN).

## Game modes / حالت‌ها
* **Campaign** – 6 chapters, 19 stages, each with its own map, enemies and unlocks (stage 1 teaches the basics, cannon only).
* **Endless** – every tower, spell and enemy is available; Easy / Normal / Hard; best wave is stored per difficulty.
* **Multiplayer (co-op, 2-4 players)** – same map, one shared base and gold treasury, anyone can build/upgrade/sell/cast.

## Multiplayer how-to / چندنفره
1. One computer runs `node server/server.js` (the host machine).
2. Every player opens `http://<host-ip>:8080` in a browser (same Wi-Fi / LAN / phone hotspot).
3. Main menu → **Multiplayer**. One player presses *Create room* and tells the 4-letter code; the others type it and press *Join*.
4. The host picks map + difficulty and presses *Start*. Enemy HP scales with the number of players.

Architecture: the host browser runs the real game simulation and sends a snapshot 15 times/second through the relay server;
the other players mirror it (same 3D objects, no simulation) and send commands (build, upgrade, sell, spells...) back to the host.

**Bluetooth:** web pages cannot use Bluetooth for device-to-device games (Web Bluetooth is client-to-peripheral only).
What works: connect the devices with Wi-Fi/LAN/hotspot, or use Bluetooth *tethering/PAN* which creates a normal IP network
(then use the host's IP shown by the server).

## Controls
Tap a glowing plot → circle opens → tap a tower (range preview) → tap the ✔ to build. Tap a tower: ⬆️ upgrade (green arrows show the gain), 💰 sell.
Mouse wheel / pinch / ＋－ buttons zoom, drag to pan when zoomed. ⚙️ settings (language, theme, sound, graphics quality, speed).
Everything is saved in `localStorage` (keys start with `td_`); "Forget all saved data" in the main menu wipes it.

## Project structure
```
tower-defense/
├─ index.html            page, menus, import map (Three.js + add-ons)
├─ css/                  style.css (layout, HUD, menus, motion), themes.css (dark/light variables)
├─ js/
│  ├─ main.js            bootstrap, input (tap/pan/pinch/wheel), game loop
│  ├─ config.js          towers, enemies, elements, chapters/stages, endless difficulties, waves, sounds
│  ├─ game.js            Game: state, economy, waves, spells, destruction, hazards
│  ├─ enemy.js tower.js projectile.js soldier.js special.js   entities (models + behaviour)
│  ├─ grid.js decor.js textures.js ambient.js scene3d.js     map, scenery, procedural textures, particles, renderer (PBR + bloom)
│  ├─ ui.js              menus, radial build menu, panels, lobby
│  ├─ net.js             multiplayer: Net (connection), NetHost (authoritative host), RemoteGame (client view)
│  ├─ save.js i18n.js audio.js thumbs.js                     progress, FA/EN texts, Web Audio, model previews
├─ server/server.js      zero-dependency static server + WebSocket relay (rooms of up to 4)
├─ assets/               (nothing needed: all content is procedural)
└─ package.json start.sh start.bat README.md
```
