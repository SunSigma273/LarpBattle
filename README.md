# LarpBattle
A browser-based 2D fighting-game prototype with offline mode and six-digit online rooms.

## Run
- Node.js 20+
- `npm install`
- `npm start`
- Open `http://localhost:3000`

The Node server serves the game and handles WebSocket rooms. `/health` returns JSON health status. For online play, deploy as a persistent Node.js web service (not a static site). Set the service's start command to `npm start`.
