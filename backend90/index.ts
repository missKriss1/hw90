import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import { WebSocket } from 'ws';

const app = express();
expressWs(app);

const port = 8000;
app.use(cors());

interface Pixel {
    x: number;
    y: number;
    color: string;
}

const router = express.Router();

const connectedClients: WebSocket[] = [];
let canvasPixel: Pixel[] = [];

router.ws('/canvas', (ws, req) => {
    connectedClients.push(ws);

    ws.send(JSON.stringify({
        type: 'INIT_PIXELS',
        message: canvasPixel,
    }));

    ws.on('message', (message) => {
        try {
            const decodedMessage = JSON.parse(message.toString());

            if (decodedMessage.type === 'CREATE_PIXELS_ARRAY') {
                canvasPixel = [...canvasPixel, ...decodedMessage.pixelsArray];

                connectedClients.forEach((clientWs) => {
                    clientWs.send(JSON.stringify({
                        type: 'NEW_PIXEL',
                        message: decodedMessage.pixelsArray,
                    }));
                });
            } else if (decodedMessage.type === 'CLEAR_CANVAS') {
                canvasPixel = [];

                connectedClients.forEach((clientWs) => {
                    clientWs.send(JSON.stringify({
                        type: 'CLEAR_CANVAS',
                    }));
                });
            }
        } catch (e) {
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
    });

    ws.on('close', () => {
        const index = connectedClients.indexOf(ws);
        if (index !== -1) {
            connectedClients.splice(index, 1);
            console.log('Client disconnected. Remaining clients:', connectedClients.length);
        }
    });
});

app.use(router);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
