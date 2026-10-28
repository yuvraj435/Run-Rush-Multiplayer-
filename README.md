# RUN RUSH — Online Multiplayer

A simple Node.js + Socket.IO version of RUN RUSH. It preserves the original runner game and adds room codes, invite links, and live player score/status updates across devices.

## Run locally
1. Install Node.js 18 or newer.
2. Open a terminal in this folder.
3. Run `npm install`
4. Run `npm start`
5. Open `http://localhost:3000`

For testing on the same Wi-Fi, open `http://YOUR-COMPUTER-LAN-IP:3000` on the other device. Both devices must be on the same network and the computer firewall must allow the port.

## Put it online
Deploy this folder to a Node.js host that supports long-lived WebSocket connections (for example, Render, Railway, or another Node hosting service). The host should run `npm install` during build and `npm start` to start the app. Use the public HTTPS URL and share the room code/invite link. Socket.IO uses the host's assigned `PORT` automatically.

A static-only host (for example, a plain GitHub Pages site) is not enough by itself because the room system needs a running server. Free hosting availability and sleep limits vary by provider.

## Current multiplayer behavior
- Create a room with a generated 5-character code.
- Friends join using the code or invite URL.
- Up to 8 players per room.
- Player names, scores, and running/finished status update live.
- The original single-player running mechanics remain available.

## Important limitation
This first online version synchronizes the room and live scores/status; each player runs their own local obstacle simulation. It is not yet a deterministic shared-world race with perfectly synchronized obstacles or server-authoritative collision detection. It is a starter multiplayer implementation, not cheat-proof competitive networking.
