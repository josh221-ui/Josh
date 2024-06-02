const express = require('express');
const WebSocket = require('ws');

const app = express();
const port = 3000;

app.use(express.static('public'));

const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });

let callCode = generateCallCode(); // Initial call code
let connectedUsers = new Set(); // Set to store connected users

wss.on('connection', (ws) => {
    connectedUsers.add(ws);

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'message':
                broadcastMessage(data);
                break;
            case 'end-call':
                endCall();
                break;
            case 'regenerate-code':
                regenerateCode();
                break;
            default:
                break;
        }
    });

    ws.on('close', () => {
        connectedUsers.delete(ws);
    });

    // Send the initial call code to the newly connected user
    ws.send(JSON.stringify({ type: 'callCode', callCode }));
});

function broadcastMessage(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function endCall() {
    // Implement logic to end the call
    // For simplicity, let's just log a message
    console.log('Call ended');
}

function regenerateCode() {
    callCode = generateCallCode();
    broadcastMessage({ type: 'callCode', callCode });
}

function generateCallCode() {
    // Generate a random 6-digit call code
    return Math.floor(100000 + Math.random() * 900000);
}