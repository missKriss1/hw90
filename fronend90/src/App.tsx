import { useEffect, useRef, useState } from "react";

interface Pixel {
    x: number;
    y: number;
    color: string;
    sizeCircle: number;
}

interface Canvas {
    mouseDown: boolean;
    pixelsArray: Pixel[];
    color: string;
    sizeCircle: number;
}

const App = () => {
    const [state, setState] = useState<Canvas>({
        mouseDown: false,
        pixelsArray: [],
        color: '#000000',
        sizeCircle: 10,
    });
    const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/canvas');
        setWebSocket(ws);

        ws.onmessage = (event) => {
            const decoded = JSON.parse(event.data);

            if (decoded.type === 'INIT_PIXELS') {
                decoded.message.forEach((message: Pixel) => {
                    const canvas = canvasRef.current;
                    if (canvas) {
                        const context = canvas.getContext('2d');
                        if (context) {
                            context.fillStyle = message.color;
                            context.beginPath();
                            context.arc(message.x, message.y, message.sizeCircle, 0, 2 * Math.PI);
                            context.fill();
                        }
                    }
                });
            } else if (decoded.type === 'NEW_PIXEL') {
                decoded.message.forEach((message: Pixel) => {
                    const canvas = canvasRef.current;
                    if (canvas) {
                        const context = canvas.getContext('2d');
                        if (context) {
                            context.fillStyle = message.color;
                            context.beginPath();
                            context.arc(message.x, message.y, message.sizeCircle, 0, 2 * Math.PI);
                            context.fill();
                        }
                    }
                });
            } else if (decoded.type === 'CLEAR_CANVAS') {
                const canvas = canvasRef.current;
                if (canvas) {
                    const context = canvas.getContext('2d');
                    if (context) {
                        context.clearRect(0, 0, canvas.width, canvas.height);
                    }
                }
            }
        };

        return () => {
            ws.close();
        };
    }, []);

    const canvasMouseMoveHandler = (event: React.MouseEvent) => {
        if (state.mouseDown) {
            const clientX = event.nativeEvent.offsetX;
            const clientY = event.nativeEvent.offsetY;

            setState(prevState => ({
                ...prevState,
                pixelsArray: [...prevState.pixelsArray, {
                    x: clientX,
                    y: clientY,
                    color: state.color,
                    sizeCircle: state.sizeCircle
                }]
            }));

            const canvas = canvasRef.current;
            if (canvas) {
                const context = canvas.getContext('2d');
                if (context) {
                    context.fillStyle = state.color;
                    context.beginPath();
                    context.arc(clientX, clientY, state.sizeCircle, 0, 2 * Math.PI);
                    context.fill();
                }
            }
        }
    };

    const mouseDownHandler = () => {
        setState({ ...state, mouseDown: true });
    };

    const mouseUpHandler = () => {
        if (webSocket) {
            webSocket.send(JSON.stringify({
                type: 'CREATE_PIXELS_ARRAY',
                pixelsArray: state.pixelsArray,
            }));
        }
        setState({ ...state, mouseDown: false, pixelsArray: [] });
    };

    const clearHandler = () => {
        if (webSocket) {
            webSocket.send(JSON.stringify({
                type: 'CLEAR_CANVAS',
            }));
        }
    };

    return (

        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <h2>Draw the pictures</h2>
            <canvas
                ref={canvasRef}
                style={{marginLeft: '100px', border: '1px solid black'}}
                width={500}
                height={500}
                onMouseDown={mouseDownHandler}
                onMouseUp={mouseUpHandler}
                onMouseMove={canvasMouseMoveHandler}
            />
            <div style={{marginTop: '10px'}}>
                <button onClick={clearHandler} className='btn'>Clear canvas</button>
                <div>
                    <label style={{marginLeft: '20px'}}>Color:</label>
                    <input
                        type="color"
                        value={state.color}
                        onChange={(e) => setState({...state, color: e.target.value})}
                        style={{marginTop: '20px'}}
                    />
                </div>
                <div>
                    <label style={{marginLeft: '20px'}}>Size:</label>
                    <input
                        type="number"
                        value={state.sizeCircle}
                        min={1}
                        max={20}
                        onChange={(e) => setState({...state, sizeCircle: +e.target.value})}
                        style={{marginTop: '20px'}}
                    />
                </div>
            </div>
        </div>
    );
};

export default App;
