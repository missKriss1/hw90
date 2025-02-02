import { useEffect, useRef, useState } from "react";

interface Pixel {
    x: number;
    y: number;
    color: string;
}

const App = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/canvas');
        setWebSocket(ws);


        ws.onclose = () => console.log('Connection closed');

        ws.onmessage = (e) => {
            const decodedMessage = JSON.parse(e.data);
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext('2d');
            if (context) {
                if (decodedMessage.type === 'NEW_CANVAS' || decodedMessage.type === 'INIT_CANVAS') {
                    const pixels: Pixel[] = JSON.parse(decodedMessage.payload);
                    pixels.forEach(pixel => {
                        context.fillStyle = pixel.color;
                        context.fillRect(pixel.x, pixel.y, 1, 1);
                    });
                }
            }
        };

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, []);

    const sendPixel = (x: number, y: number, color: string) => {
        if (!webSocket) return;

        const pixel = { x, y, color };
        webSocket.send(JSON.stringify({
            type: 'DRAW_PIXEL',
            payload: JSON.stringify(pixel),
        }));
    };

    const changeMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (context) {
            context.beginPath();
            context.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
        }
    };

    const changeMouseMove = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (context && e.buttons === 1) {
            const x = e.clientX - canvas.offsetLeft;
            const y = e.clientY - canvas.offsetTop;

            context.lineTo(x, y);
            context.stroke();

            sendPixel(x, y, context.strokeStyle.toString());
        }
    };

    const mouseUp = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (context) {
            context.closePath();
        }
    };

    return (
        <div>
            <h2 style={{ marginLeft: '550px', marginTop: '0px', textAlign: 'center' }}>
                Draw the pictures
            </h2>
            <canvas
                ref={canvasRef}
                width={500}
                height={500}
                style={{ border: "2px solid black", marginLeft: '550px' }}
                onMouseDown={changeMouseDown}
                onMouseMove={changeMouseMove}
                onMouseUp={mouseUp}
            />
        </div>
    );
};

export default App;
