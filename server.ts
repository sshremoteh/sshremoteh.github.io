import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Initialize Gemini API client safely (lazy-loaded if called)
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. AI Features will be unavailable.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY_FOR_TESTING",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  // Map to store room state: { roomId -> { deviceSocket, webSockets } }
  const rooms = new Map<string, {
    device: WebSocket | null;
    webClients: Set<WebSocket>;
  }>();

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", roomsActive: rooms.size });
  });

  // API Route: AI Command Assistant
  app.post("/api/gemini/generate-command", async (req, res) => {
    try {
      const { prompt, os } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `The user wants to perform the following action on their PC: "${prompt}".
Please generate the exact terminal/shell command to achieve this.
Generate appropriate versions for:
1. Windows (PowerShell or cmd)
2. macOS / Linux (bash/zsh)

You must return a JSON response with the following format:
{
  "windows": "command for windows",
  "unix": "command for mac/linux",
  "explanation": "Short, friendly explanation in Russian of what this command does and any risks."
}

Ensure the response contains ONLY this JSON. Do not include markdown blocks or formatting outside the JSON itself.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              windows: { type: Type.STRING, description: "Command for Windows PC" },
              unix: { type: Type.STRING, description: "Command for macOS or Linux PC" },
              explanation: { type: Type.STRING, description: "Brief explanation in Russian of what the command does" },
            },
            required: ["windows", "unix", "explanation"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from AI model");
      }

      const parsed = JSON.parse(responseText.trim());
      res.json(parsed);
    } catch (error: any) {
      console.error("AI Command Generator Error:", error);
      res.status(500).json({ 
        error: "Failed to generate command using AI", 
        details: error?.message || "Unknown error" 
      });
    }
  });

  // Attach WebSocket upgrade handling
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;

    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Handle WebSocket connections
  wss.on("connection", (ws: WebSocket) => {
    let clientRoom: string | null = null;
    let clientRole: "device" | "web" | null = null;

    ws.on("message", (message: string) => {
      try {
        const rawString = message.toString();
        const data = JSON.parse(rawString);
        const { type, room, role } = data;

        if (!room) return;

        // 1. Join phase
        if (type === "join") {
          clientRoom = room;
          clientRole = role;

          if (!rooms.has(room)) {
            rooms.set(room, { device: null, webClients: new Set() });
          }
          const roomData = rooms.get(room)!;

          if (role === "device") {
            if (roomData.device && roomData.device !== ws) {
              try {
                roomData.device.close();
              } catch (e) {}
            }
            roomData.device = ws;
            console.log(`[WS] PC Device joined room: ${room}`);

            // Broadcast status to web clients
            const statusMsg = JSON.stringify({
              type: "status",
              room,
              status: "online",
              ts: new Date().toISOString()
            });
            roomData.webClients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(statusMsg);
              }
            });
          } else if (role === "web") {
            roomData.webClients.add(ws);
            console.log(`[WS] Web dashboard joined room: ${room}`);

            // Send current device status to the web dashboard immediately
            const isDeviceOnline = roomData.device !== null && roomData.device.readyState === WebSocket.OPEN;
            ws.send(JSON.stringify({
              type: "status",
              room,
              status: isDeviceOnline ? "online" : "offline",
              ts: new Date().toISOString()
            }));
          }
          return;
        }

        // 2. Relay phase (ensure registered)
        if (clientRoom && rooms.has(clientRoom)) {
          const roomData = rooms.get(clientRoom)!;

          if (type === "command") {
            // Relaying commands from Web to Device
            if (roomData.device && roomData.device.readyState === WebSocket.OPEN) {
              roomData.device.send(rawString);
            } else {
              ws.send(JSON.stringify({
                type: "output",
                room: clientRoom,
                output: "[❌ Ошибка: Компьютер находится в офлайне. Запустите скрипт client.py на вашем ПК]",
                cmd: data.cmd || "",
                ts: new Date().toISOString()
              }));
            }
          } else if (type === "output") {
            // Relaying terminal output from Device to all Web clients
            roomData.webClients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(rawString);
              }
            });
          } else if (type === "ping") {
            // Relaying web client pings to device
            if (roomData.device && roomData.device.readyState === WebSocket.OPEN) {
              roomData.device.send(rawString);
            } else {
              ws.send(JSON.stringify({
                type: "status",
                room: clientRoom,
                status: "offline",
                ts: new Date().toISOString()
              }));
            }
          } else if (type === "pong") {
            // Relaying device pongs back to web clients
            roomData.webClients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(rawString);
              }
            });
          }
        }
      } catch (err) {
        console.error("Error processing WS message:", err);
      }
    });

    ws.on("close", () => {
      if (clientRoom && rooms.has(clientRoom)) {
        const roomData = rooms.get(clientRoom)!;

        if (clientRole === "device") {
          if (roomData.device === ws) {
            roomData.device = null;
            console.log(`[WS] PC Device left room: ${clientRoom}`);
            
            // Notify web clients
            const statusMsg = JSON.stringify({
              type: "status",
              room: clientRoom,
              status: "offline",
              ts: new Date().toISOString()
            });
            roomData.webClients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(statusMsg);
              }
            });
          }
        } else if (clientRole === "web") {
          roomData.webClients.delete(ws);
          console.log(`[WS] Web dashboard left room: ${clientRoom}`);
        }

        // Clean up empty rooms to avoid memory leak
        if (!roomData.device && roomData.webClients.size === 0) {
          rooms.delete(clientRoom);
        }
      }
    });

    ws.on("error", (err) => {
      console.error("WebSocket client connection error:", err);
    });
  });

  // Serve static files / Vite HMR
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start fullstack server:", err);
});
