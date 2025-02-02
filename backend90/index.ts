import express from "express";
import expressWs from 'express-ws';
import cors from "cors";
import { WebSocket } from "ws";

const app = express();
expressWs(app);

const port = 8000;
app.use(cors());

const router = express.Router();

const connectedClients: WebSocket[] = [];

interface Pixel {
    x: number;
    y: number;
    color: string;
}

interface IncomingMessage {
    type: string;
    payload: string;
}

let canvasPixel: Pixel[] = [];

router.ws('/canvas', (ws, req) => {
    connectedClients.push(ws);

    ws.send(JSON.stringify({ type: 'INIT_CANVAS', payload: JSON.stringify(canvasPixel) }));

    ws.on('message', (message) => {
        try {
            const decodedMessage = JSON.parse(message.toString()) as IncomingMessage;

            if (decodedMessage.type === "DRAW_PIXEL") {
                const newPixel: Pixel = JSON.parse(decodedMessage.payload);

                canvasPixel.push(newPixel);

                connectedClients.forEach((clientWs) => {
                    clientWs.send(JSON.stringify({
                        type: 'NEW_CANVAS',
                        payload: JSON.stringify(canvasPixel),
                    }));
                });
            }
        } catch (e) {
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
    });

    ws.on('close', () => {
        const index = connectedClients.indexOf(ws);
        connectedClients.splice(index, 1);
    });
});

app.use(router);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
