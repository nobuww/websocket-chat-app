import { WebSocketServer, WebSocket } from 'ws';
import type { RawData } from 'ws';
import { createServer, IncomingMessage, ServerResponse } from 'http';

const PORT: number = Number(process.env.PORT) || 5000;

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
        console.log('[Server] Health check ping received.');
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

const wss = new WebSocketServer({ server });

const clients = new Map<string, WebSocket>();

function broadcast(senderUsername: string, message: string, target: string = "") {
    const isPrivate = target && target !== "all";
    const tag = `[${senderUsername} -> ${isPrivate ? "you" : "all"}]`;
    const fullMessage = `${tag} ${message}`;
    console.log(fullMessage);

    let found = false;
    for (const [username, ws_client] of clients.entries()) {
        if (username === senderUsername) continue;

        if (isPrivate && username !== target) {
            continue;
        }

        if (ws_client.readyState === WebSocket.OPEN) {
            ws_client.send(fullMessage);
            found = true;
        }
    }
    if (!found && isPrivate) {
        console.log(`[Server] User '${target}' not found for private message.`);
    }
}

function broadcastUserList() {
    const allUsers = Array.from(clients.keys());
    
    for (const [username, ws_client] of clients.entries()) {
        if (ws_client.readyState === WebSocket.OPEN) {
            const otherUsers = allUsers.filter(u => u !== username);
            const message = JSON.stringify({
                type: 'userlist',
                users: otherUsers
            });
            ws_client.send(message);
        }
    }
    console.log(`Broadcasting user list to ${clients.size} clients`);
}

wss.on('connection', (ws_client: WebSocket) => {
    let currentUsername: string = ""; 

    ws_client.on('message', (data: RawData) => {
        try {
            const msg: string = data.toString().trim();
            if (msg.length === 0) return;

            if (!currentUsername) {
                if (clients.has(msg)) {
                    ws_client.send("[server] Username sudah dipakai.");
                    ws_client.close();
                    return;
                }
                
                currentUsername = msg;
                clients.set(currentUsername, ws_client);

                const otherUsers = Array.from(clients.keys()).filter(u => u !== currentUsername);
                ws_client.send(JSON.stringify({
                    type: 'userlist',
                    users: otherUsers
                }));

                broadcast("server", `${currentUsername} has joined the chat`);
                broadcastUserList();
                return;
            }

            if (msg === "/quit") {
                ws_client.close();
                return;
            }

            let target = "";
            let messageBody = msg;
            
            try {
                const jsonMsg = JSON.parse(msg);
                if (jsonMsg.type === 'message') {
                    target = jsonMsg.target || "";
                    messageBody = jsonMsg.body || "";
                }
            } catch (e) {
                target = "";
                messageBody = msg;
            }

            if (target && target !== "all" && !clients.has(target)) {
                ws_client.send(`[server] User '${target}' tidak ditemukan.`);
                return;
            }

            broadcast(currentUsername, messageBody, target);

        } catch (e: any) {
            console.error("Error processing message:", e.message);
            ws_client.send("[server] An error occurred.");
        }
    });

    ws_client.on('close', () => {
        if (currentUsername) {
            clients.delete(currentUsername);
            broadcast("server", `*** ${currentUsername} keluar ***`);
            broadcastUserList();
        }
    });

    ws_client.on('error', (err: Error) => {
        console.error(`WebSocket error for ${currentUsername}: ${err.message}`);
    });
});

server.listen(PORT, () => {
    console.log(`Chat server started on port ${PORT}...`);
});