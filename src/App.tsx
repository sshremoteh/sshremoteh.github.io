import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Terminal as TerminalIcon, 
  Settings, 
  Copy, 
  Check, 
  Power, 
  RefreshCw, 
  Cpu, 
  HardDrive, 
  Network, 
  Activity, 
  FolderOpen, 
  Sparkles, 
  Download, 
  BookOpen, 
  Play, 
  Trash2, 
  HelpCircle,
  Clock,
  Server,
  User,
  AlertTriangle,
  Monitor,
  ChevronRight,
  Code,
  ShieldCheck
} from "lucide-react";

// Types
interface TerminalLine {
  id: string;
  type: "input" | "output" | "system" | "error" | "success";
  content: string;
  timestamp: string;
  cmd?: string;
}

interface CommandHistoryItem {
  id: string;
  command: string;
  timestamp: string;
  status: "pending" | "success" | "error";
  duration?: number;
  output?: string;
}

interface AiCommandResponse {
  windows: string;
  unix: string;
  explanation: string;
}

export default function App() {
  // Connection states
  const [roomId, setRoomId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) return roomParam;
    const local = localStorage.getItem("remote_room_id");
    if (local) return local;
    const generated = Math.random().toString(16).substring(2, 14); // 12 hex characters
    localStorage.setItem("remote_room_id", generated);
    return generated;
  });

  const [authToken, setAuthToken] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get("auth");
    if (authParam) return authParam;
    const local = localStorage.getItem("remote_auth_token");
    if (local) return local;
    const generated = "token_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("remote_auth_token", generated);
    return generated;
  });

  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [isDeviceOnline, setIsDeviceOnline] = useState<boolean>(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [utcTime, setUtcTime] = useState<string>("");
  
  // UI states
  const [currentTab, setCurrentTab] = useState<"terminal" | "setup" | "history">("terminal");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [newRoomId, setNewRoomId] = useState<string>(roomId);
  const [newAuthToken, setNewAuthToken] = useState<string>(authToken);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);
  const [copiedAi, setCopiedAi] = useState<string | null>(null);

  // Settings & forms
  const [commandInput, setCommandInput] = useState<string>("");
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    {
      id: "init",
      type: "system",
      content: "Handshake initialized. Waiting for WebSocket connection...",
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);

  // AI Assistant states
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AiCommandResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Broker URL definitions
  const serverWsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;

  // Update UTC time clock in footer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLines]);

  // Connect to WebSocket
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId]);

  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    addTerminalLine("system", `Handshake: Connecting to proxy broker ${serverWsUrl}...`);
    
    try {
      const ws = new WebSocket(serverWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsWsConnected(true);
        addTerminalLine("success", "Handshake secure. WebSocket tunnel established.");
        
        // Register in the room
        const joinMsg = {
          type: "join",
          room: roomId,
          role: "web",
          ts: new Date().toISOString()
        };
        ws.send(JSON.stringify(joinMsg));
        addTerminalLine("system", `Tunnel: Subscribed to control room channel [${roomId}]`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.room !== roomId) return;

          if (data.type === "status") {
            const online = data.status === "online";
            setIsDeviceOnline(online);
            setLastSeen(new Date().toLocaleTimeString());
            addTerminalLine(
              online ? "success" : "error", 
              `Device changed status: ${online ? "ONLINE" : "OFFLINE"}`
            );
          } else if (data.type === "output") {
            // Find and update pending command in history
            setCommandHistory(prev => prev.map(item => {
              if (item.command === data.cmd && item.status === "pending") {
                return { 
                  ...item, 
                  status: data.output.startsWith("[❌") ? "error" : "success",
                  output: data.output 
                };
              }
              return item;
            }));

            // Write output to terminal
            addTerminalLine("output", data.output, data.cmd);
          } else if (data.type === "pong") {
            setIsDeviceOnline(true);
            setLastSeen(new Date().toLocaleTimeString());
            addTerminalLine("success", "Terminal link active. Device acknowledged status ping.");
          }
        } catch (e) {
          // Non-JSON message, display as raw output
          addTerminalLine("output", event.data);
        }
      };

      ws.onclose = () => {
        setIsWsConnected(false);
        setIsDeviceOnline(false);
        addTerminalLine("error", "Tunnel disconnected. Retrying handshake in 5 seconds...");
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (err) => {
        console.error("WS connection error:", err);
        addTerminalLine("error", "Bridge error: Unable to hold WebSocket connection state.");
      };
    } catch (err: any) {
      addTerminalLine("error", `Bridge creation failure: ${err.message}`);
    }
  };

  const addTerminalLine = (type: TerminalLine["type"], content: string, cmd?: string) => {
    setTerminalLines(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        type,
        content,
        timestamp: new Date().toLocaleTimeString(),
        cmd
      }
    ].slice(-150)); // keep last 150 lines
  };

  const sendCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    if (!isWsConnected) {
      addTerminalLine("error", "Tunnel inactive: Commands cannot be relayed. Reconnecting...");
      return;
    }

    // Add to terminal view
    addTerminalLine("input", trimmed);

    // Save to command history list
    const newHistoryItem: CommandHistoryItem = {
      id: Math.random().toString(),
      command: trimmed,
      timestamp: new Date().toLocaleTimeString(),
      status: "pending"
    };
    setCommandHistory(prev => [newHistoryItem, ...prev]);
    setHistoryIndex(-1);

    // Send via WebSocket
    const payload = {
      type: "command",
      room: roomId,
      cmd: trimmed,
      auth: authToken,
      ts: new Date().toISOString()
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      addTerminalLine("error", "Proxy execution error: WebSocket connection state is dead.");
    }

    setCommandInput("");
  };

  const checkDeviceStatus = () => {
    if (!isWsConnected) {
      addTerminalLine("error", "Ping aborted: WebSocket broker tunnel offline.");
      return;
    }
    
    addTerminalLine("system", "Relaying status check (PING) request to device...");
    const pingPayload = {
      type: "ping",
      room: roomId,
      ts: new Date().toISOString()
    };
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(pingPayload));
    }
  };

  // Keyboard navigation for terminal command history
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendCommand(commandInput);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = historyIndex + 1;
        if (nextIndex < commandHistory.length) {
          setHistoryIndex(nextIndex);
          setCommandInput(commandHistory[nextIndex].command);
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setCommandInput(commandHistory[nextIndex].command);
      } else {
        setHistoryIndex(-1);
        setCommandInput("");
      }
    }
  };

  // Generate Python script content for the client
  const getPythonScript = () => {
    return `#!/usr/bin/env python3
"""
client.py — Клиент для удалённого управления устройством через WebSocket.
Запустите этот скрипт на управляемом устройстве.
Он подключится к брокеру и будет ждать команды из веб-панели.
"""

import asyncio
import json
import subprocess
import sys
import uuid
import logging
import os
from datetime import datetime

# ─────────────────────────────────────────────
#  НАСТРОЙКИ — подтянуты автоматически для вашей панели
# ─────────────────────────────────────────────

# Уникальный токен авторизации (пароль).
AUTH_TOKEN = "${authToken}"

# ID комнаты для сопряжения с веб-панелью.
ROOM_ID = "${roomId}"

# WebSocket брокер (наш сервер).
WS_BROKER = "${serverWsUrl}"

# Адрес веб-панели управления
PANEL_URL = "${window.location.origin}"

# Файл для логов
LOG_FILE = "client.log"

# Таймаут выполнения одной команды (секунды)
COMMAND_TIMEOUT = 30

# ─────────────────────────────────────────────
#  ЗАВИСИМОСТИ
# ─────────────────────────────────────────────

try:
    import websockets
except ImportError:
    print("[ОШИБКА] Не установлен модуль websockets.")
    print("Установите его: pip install websockets")
    sys.exit(1)

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.text import Text
    from rich import print as rprint
    RICH_AVAILABLE = True
    console = Console()
except ImportError:
    RICH_AVAILABLE = False

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)

def print_banner(room_id: str, connect_url: str):
    if RICH_AVAILABLE:
        console.print()
        console.print(Panel.fit(
            f"[bold green]✓ Клиент запущен успешно[/bold green]\\n\\n"
            f"[yellow]ID комнаты:[/yellow] [bold cyan]{room_id}[/bold cyan]\\n\\n"
            f"[yellow]Панель управления:[/yellow]\\n"
            f"[bold white underline]{connect_url}[/bold white underline]\\n\\n"
            f"[dim]Ожидание команд... Нажмите Ctrl+C для остановки.[/dim]",
            title="[bold magenta]🖥  Remote Control Client[/bold magenta]",
            border_style="green",
        ))
        console.print()
    else:
        line = "=" * 60
        print()
        print(line)
        print("  🖥  REMOTE CONTROL CLIENT — ЗАПУЩЕН")
        print(line)
        print(f"  ID комнаты : {room_id}")
        print()
        print("  Панель управления:")
        print(f"  👉  {connect_url}")
        print()
        print("  Ожидание команд... Ctrl+C для остановки.")
        print(line)
        print()

    logger.info(f"Клиент запущен. ID комнаты: {room_id}")
    logger.info(f"URL панели управления: {connect_url}")

def execute_command(command: str) -> str:
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=COMMAND_TIMEOUT,
            env=os.environ.copy(),
        )
        output = ""
        if result.stdout:
            output += result.stdout
        if result.stderr:
            output += result.stderr
        if not output:
            output = f"[Команда выполнена, код возврата: {result.returncode}]"
        return output.strip()
    except subprocess.TimeoutExpired:
        return f"[ОШИБКА] Таймаут: команда выполнялась дольше {COMMAND_TIMEOUT} секунд."
    except Exception as e:
        return f"[ОШИБКА] {str(e)}"

async def run_client(room_id: str):
    broker_url = WS_BROKER
    reconnect_delay = 5

    while True:
        try:
            logger.info(f"Подключение к брокеру: {broker_url}")
            async with websockets.connect(
                broker_url,
                ping_interval=20,
                ping_timeout=10,
            ) as ws:
                logger.info("Соединение установлено.")

                join_msg = json.dumps({
                    "type": "join",
                    "room": room_id,
                    "role": "device",
                    "ts": datetime.utcnow().isoformat(),
                })
                await ws.send(join_msg)

                async for raw_message in ws:
                    await handle_message(ws, raw_message, room_id)

        except websockets.exceptions.ConnectionClosedOK:
            logger.info("Соединение закрыто нормально. Переподключение...")
        except websockets.exceptions.ConnectionClosedError as e:
            logger.warning(f"Соединение разорвано: {e}. Переподключение через {reconnect_delay}с...")
        except OSError as e:
            logger.error(f"Ошибка сети: {e}. Повтор через {reconnect_delay}с...")
        except Exception as e:
            logger.error(f"Неожиданная ошибка: {e}. Повтор через {reconnect_delay}с...")

        await asyncio.sleep(reconnect_delay)

async def handle_message(ws, raw_message: str, room_id: str):
    try:
        data = json.loads(raw_message)
    except json.JSONDecodeError:
        return

    msg_type = data.get("type", "")
    msg_room = data.get("room", "")

    if msg_room != room_id:
        return

    if msg_type == "ping":
        pong = json.dumps({
            "type": "pong",
            "room": room_id,
            "ts": datetime.utcnow().isoformat(),
        })
        await ws.send(pong)
        return

    if msg_type == "command":
        received_token = data.get("auth", "")
        command = data.get("cmd", "").strip()

        if received_token != AUTH_TOKEN:
            logger.warning(f"Отклонена команда с неверным токеном: '{received_token}'")
            response = json.dumps({
                "type": "output",
                "room": room_id,
                "output": "[❌ Ошибка авторизации: неверный токен]",
                "cmd": command,
                "ts": datetime.utcnow().isoformat(),
            })
            await ws.send(response)
            return

        if not command:
            return

        logger.info(f"Выполнение команды: {command}")
        output = execute_command(command)
        logger.info(f"Результат ({len(output)} символов): {output[:200]}...")

        response = json.dumps({
            "type": "output",
            "room": room_id,
            "output": output,
            "cmd": command,
            "ts": datetime.utcnow().isoformat(),
        })
        await ws.send(response)
        return

def main():
    room_id = ROOM_ID if ROOM_ID else uuid.uuid4().hex[:12]
    connect_url = f"{PANEL_URL}/?room={room_id}&auth={AUTH_TOKEN}"

    print_banner(room_id, connect_url)

    try:
        asyncio.run(run_client(room_id))
    except KeyboardInterrupt:
        logger.info("Клиент остановлен пользователем (Ctrl+C).")
        if RICH_AVAILABLE:
            console.print("\\n[yellow]Клиент остановлен.[/yellow]")
        else:
            print("\\nКлиент остановлен.")

if __name__ == "__main__":
    main()
`;
  };

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const copyAiCommand = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAi(key);
    setTimeout(() => setCopiedAi(null), 2000);
  };

  // Preset Commands configuration matching High Density theme layout
  const presetCommands = [
    {
      category: "Система",
      icon: <Cpu className="w-3.5 h-3.5 text-[#00F0FF]" />,
      commands: [
        { name: "$ systeminfo", cmd: "systeminfo", desc: "Детальная информация о Windows PC" },
        { name: "$ uname -a", cmd: "uname -a && uptime", desc: "Версия ядра Linux/macOS и время работы" },
        { name: "$ env", cmd: "env || set", desc: "Список переменных окружения ОС" }
      ]
    },
    {
      category: "Файлы",
      icon: <FolderOpen className="w-3.5 h-3.5 text-sky-400" />,
      commands: [
        { name: "$ dir", cmd: "dir", desc: "Список файлов и папок в директории Windows" },
        { name: "$ ls -la", cmd: "ls -la", desc: "Список всех файлов в Unix/macOS" },
        { name: "$ pwd", cmd: "cd || pwd", desc: "Узнать текущий путь" }
      ]
    },
    {
      category: "Диски",
      icon: <HardDrive className="w-3.5 h-3.5 text-amber-400" />,
      commands: [
        { name: "$ df -h", cmd: "df -h", desc: "Использование дисков Unix" },
        { name: "$ logicaldisk", cmd: "wmic logicaldisk get size,freespace,caption", desc: "Диски Windows" }
      ]
    },
    {
      category: "Сеть",
      icon: <Network className="w-3.5 h-3.5 text-purple-400" />,
      commands: [
        { name: "$ ipconfig", cmd: "ipconfig", desc: "Сетевые адаптеры и IP адреса на Windows" },
        { name: "$ ifconfig", cmd: "ifconfig || ip a", desc: "Сетевые адаптеры на Linux/macOS" },
        { name: "$ ping DNS", cmd: "ping -c 3 google.com || ping -n 3 google.com", desc: "Проверка пинга до Google DNS" }
      ]
    },
    {
      category: "Процессы",
      icon: <Activity className="w-3.5 h-3.5 text-rose-400" />,
      commands: [
        { name: "$ tasklist", cmd: "tasklist", desc: "Список процессов Windows" },
        { name: "$ ps aux", cmd: "ps aux | head -n 25", desc: "Топ процессов Unix" }
      ]
    }
  ];

  // AI Generation Function
  const generateAiCommand = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    setAiError(null);
    setAiResult(null);

    try {
      const response = await fetch("/api/gemini/generate-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAiResult(data);
    } catch (err: any) {
      console.error(err);
      setAiError(err?.message || "Не удалось сгенерировать команду. Проверьте соединение с интернетом или ключ API.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Update room settings
  const applySettings = () => {
    if (newRoomId.trim() && newAuthToken.trim()) {
      setRoomId(newRoomId.trim());
      setAuthToken(newAuthToken.trim());
      localStorage.setItem("remote_room_id", newRoomId.trim());
      localStorage.setItem("remote_auth_token", newAuthToken.trim());
      setShowSettings(false);
      
      // Update URL parameters dynamically without reloading
      const url = new URL(window.location.href);
      url.searchParams.set("room", newRoomId.trim());
      url.searchParams.set("auth", newAuthToken.trim());
      window.history.pushState({}, "", url.toString());
    }
  };

  // Reset settings to default random
  const resetToRandom = () => {
    const randomRoom = Math.random().toString(16).substring(2, 14);
    const randomToken = "token_" + Math.random().toString(36).substring(2, 10);
    setNewRoomId(randomRoom);
    setNewAuthToken(randomToken);
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#0C0C0E] text-[#D1D1D1] font-sans flex flex-col overflow-hidden select-none underline-offset-4">
      
      {/* Top Navigation Bar: High Density Style */}
      <nav className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#0E0E10] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#00F0FF] rounded flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <TerminalIcon className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white uppercase">REMOTE-OS V1.1</h1>
            <p className="text-[10px] font-mono text-[#00F0FF] opacity-80 uppercase tracking-wider">
              Agent: ROOM-{roomId.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Navigation tabs built directly into header for high density */}
        <div className="hidden md:flex items-center gap-1 bg-[#161618] border border-white/5 p-1 rounded-lg">
          <button
            onClick={() => setCurrentTab("terminal")}
            className={`px-4 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
              currentTab === "terminal" 
                ? "bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Terminal
          </button>
          <button
            onClick={() => setCurrentTab("setup")}
            className={`px-4 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
              currentTab === "setup" 
                ? "bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Instructions
          </button>
          <button
            onClick={() => setCurrentTab("history")}
            className={`px-4 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
              currentTab === "history" 
                ? "bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            History ({commandHistory.length})
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Tunnel Mode</span>
            <span className="text-[11px] font-mono text-zinc-300">WebSocket / Self-Hosted</span>
          </div>
          <div className="hidden lg:block h-8 w-[1px] bg-white/10"></div>
          
          <div className="flex items-center gap-2.5 bg-[#161618] px-4 py-1.5 border border-white/5 rounded-full">
            <div className={`w-2 h-2 rounded-full status-glow ${isDeviceOnline ? "bg-[#00F0FF] animate-pulse-slow" : "bg-zinc-600"}`} />
            <span className="text-[11px] font-bold text-white tracking-wide font-mono select-none uppercase">
              {isDeviceOnline ? "PC_CONNECTED" : "PC_OFFLINE"}
            </span>
          </div>

          <button
            onClick={() => {
              setNewRoomId(roomId);
              setNewAuthToken(authToken);
              setShowSettings(true);
            }}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded transition-all cursor-pointer"
            title="Настройки сопряжения"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* MOBILE TABS HEADER */}
      <div className="md:hidden h-10 border-b border-white/5 bg-[#09090C] flex shrink-0">
        <button
          onClick={() => setCurrentTab("terminal")}
          className={`flex-1 text-center text-[11px] font-mono font-bold uppercase transition-all ${
            currentTab === "terminal" ? "text-[#00F0FF] bg-[#161618]" : "text-zinc-500"
          }`}
        >
          Terminal
        </button>
        <button
          onClick={() => setCurrentTab("setup")}
          className={`flex-1 text-center text-[11px] font-mono font-bold uppercase transition-all ${
            currentTab === "setup" ? "text-[#00F0FF] bg-[#161618]" : "text-zinc-500"
          }`}
        >
          Instructions
        </button>
        <button
          onClick={() => setCurrentTab("history")}
          className={`flex-1 text-center text-[11px] font-mono font-bold uppercase transition-all ${
            currentTab === "history" ? "text-[#00F0FF] bg-[#161618]" : "text-zinc-500"
          }`}
        >
          History ({commandHistory.length})
        </button>
      </div>

      {/* BODY CONTENT WRAPPER */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR: System Identity & Presets */}
        <aside className="hidden lg:flex w-72 border-r border-white/10 bg-[#0A0A0C] flex-col shrink-0 overflow-y-auto custom-scrollbar">
          <div className="p-5 space-y-5">
            
            {/* Room information card */}
            <section>
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Session Identity</h3>
              <div className="p-3.5 bg-[#161618] border border-white/5 rounded space-y-2 font-mono text-xs select-all">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Room ID:</span>
                  <span className="text-[#00F0FF] font-bold">{roomId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Auth Token:</span>
                  <span className="text-zinc-300">
                    {authToken.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                  <span className="text-zinc-500 text-[10px]">Active link:</span>
                  <span className={`w-2 h-2 rounded-full ${isWsConnected ? "bg-[#00F0FF] status-glow" : "bg-red-500"}`} />
                </div>
              </div>
            </section>

            {/* Quick stats panel */}
            <section>
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Tunnel Status</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-[#161618] border border-white/5 rounded">
                  <div className="text-[9px] text-zinc-500 uppercase font-mono">Web Bridge</div>
                  <div className="text-[11px] font-mono text-white mt-0.5 font-bold uppercase">
                    {isWsConnected ? "ACTIVE" : "DOWN"}
                  </div>
                </div>
                <div className="p-2.5 bg-[#161618] border border-white/5 rounded">
                  <div className="text-[9px] text-zinc-500 uppercase font-mono">PC Device</div>
                  <div className={`text-[11px] font-mono mt-0.5 font-bold uppercase ${isDeviceOnline ? "text-[#00F0FF]" : "text-zinc-500"}`}>
                    {isDeviceOnline ? "ONLINE" : "OFFLINE"}
                  </div>
                </div>
              </div>
            </section>

            {/* Preset Command Buttons */}
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Preset Commands</h3>
                <span className="text-[9px] text-zinc-600 font-mono">Click to insert</span>
              </div>
              <div className="space-y-3">
                {presetCommands.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1.5 select-none font-mono">
                      {cat.icon}
                      {cat.category}
                    </div>
                    <div className="space-y-1">
                      {cat.commands.map((cmdItem, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => setCommandInput(cmdItem.cmd)}
                          className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-zinc-400 sidebar-item rounded border border-transparent transition-colors hover:text-[#00F0FF] hover:border-white/5 focus:outline-none"
                          title={cmdItem.desc}
                        >
                          {cmdItem.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          <div className="mt-auto p-5 border-t border-white/5 bg-[#0C0C0E]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-wider">Auto-Reconnect</span>
              <div className="w-8 h-4 bg-[#00F0FF]/20 rounded-full relative select-none">
                <div className="absolute right-1 top-1 w-2 h-2 bg-[#00F0FF] rounded-full status-glow"></div>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 leading-tight italic select-none">Socket link retry interval: 5.0s</p>
          </div>
        </aside>

        {/* MAIN PANEL CONTENT */}
        <main className="flex-1 flex flex-col bg-[#08080A] overflow-hidden">
          
          <div className="flex-1 p-4 md:p-6 flex flex-col overflow-hidden">
            
            <AnimatePresence mode="wait">
              
              {/* TAB 1: TERMINAL VIEW */}
              {currentTab === "terminal" && (
                <motion.div 
                  key="terminal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col gap-4 overflow-hidden"
                >
                  {/* Console screen styled exactly matching the mockup */}
                  <div className="flex-1 bg-[#050506] border border-white/10 rounded-lg overflow-hidden shadow-2xl flex flex-col relative">
                    
                    {/* Shell Top-bar */}
                    <div className="h-8 border-b border-white/5 bg-[#121214] flex items-center px-4 justify-between shrink-0 select-none">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40"></div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 tracking-wider">
                        {roomId}@remote-shell: ~ ({isDeviceOnline ? "active tunnel" : "offline"})
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setTerminalLines([
                              {
                                id: "clear",
                                type: "system",
                                content: "[SYSTEM] Shell session log cleared.",
                                timestamp: new Date().toLocaleTimeString()
                              }
                            ]);
                          }}
                          className="text-[9px] font-mono text-zinc-500 hover:text-white transition-colors cursor-pointer"
                          title="Очистить терминал"
                        >
                          CLEAR
                        </button>
                        <span className="text-zinc-600 text-[10px] select-none">|</span>
                        <button
                          onClick={() => {
                            const text = terminalLines.map(line => `[${line.timestamp}] ${line.type === "input" ? "user@remote:~$ " : ""}${line.content}`).join("\n");
                            copyToClipboard(text, () => {});
                            addTerminalLine("system", "[SYSTEM] Captured full console logs to clipboard.");
                          }}
                          className="text-[9px] font-mono text-[#00F0FF] hover:underline transition-colors cursor-pointer"
                        >
                          COPY_LOG
                        </button>
                      </div>
                    </div>

                    {/* Shell Screen Output Body */}
                    <div className="flex-1 p-5 font-mono text-xs leading-relaxed overflow-y-auto terminal-scrollbar custom-scrollbar select-text bg-[#050506]">
                      
                      <div className="text-zinc-500 mb-4 select-none pb-3 border-b border-white/5 space-y-1">
                        <div>[HANDSHAKE] Connected to Secure WebSocket Gateway: <span className="text-zinc-400 font-bold">{serverWsUrl}</span></div>
                        <div>[SYSTEM] Room code assigned: <span className="text-[#00F0FF] font-bold">{roomId}</span></div>
                        <div>[STATUS] PC link: {isDeviceOnline ? (
                          <span className="text-emerald-400 font-bold">[ONLINE] Handshake ready.</span>
                        ) : (
                          <span className="text-zinc-400">[PENDING] Launch client.py on host.</span>
                        )}</div>
                      </div>

                      {terminalLines.map((line) => (
                        <div key={line.id} className="mb-2.5">
                          {line.type === "input" && (
                            <div className="flex gap-2">
                              <span className="text-[#00F0FF] select-none">user@remote:~$</span>
                              <span className="text-white font-bold break-all select-all">{line.content}</span>
                              <span className="text-[9px] text-zinc-600 select-none ml-auto shrink-0">{line.timestamp}</span>
                            </div>
                          )}

                          {line.type === "output" && (
                            <div className="bg-zinc-950/50 border-l-2 border-[#00F0FF] p-3 my-2 text-zinc-300 font-mono text-[11px] leading-normal break-all whitespace-pre-wrap select-text">
                              {line.cmd && (
                                <div className="text-[9px] text-zinc-500 uppercase tracking-widest select-none mb-1">
                                  Output for: {line.cmd}
                                </div>
                              )}
                              {line.content}
                            </div>
                          )}

                          {line.type === "system" && (
                            <div className="text-zinc-500 italic select-none">
                              [SYSTEM] {line.content}
                            </div>
                          )}

                          {line.type === "success" && (
                            <div className="text-[#00F0FF] select-none">
                              [SYSTEM] {line.content}
                            </div>
                          )}

                          {line.type === "error" && (
                            <div className="text-red-500 font-bold">
                              [ERROR] {line.content}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Flashing terminal cursor if online */}
                      {isDeviceOnline && (
                        <div className="flex gap-2 items-center animate-pulse mt-1 select-none">
                          <span className="text-[#00F0FF]">user@remote:~$</span>
                          <span className="w-2.5 h-4 bg-[#00F0FF]"></span>
                        </div>
                      )}

                      <div ref={terminalEndRef} />
                    </div>

                    {/* Console Command Input Bar */}
                    <div className="h-16 bg-[#0E0E10] border-t border-white/10 flex items-center px-4 gap-3 shrink-0">
                      <div className="text-sm font-mono text-zinc-500 select-none">$</div>
                      
                      <input
                        type="text"
                        value={commandInput}
                        onChange={(e) => setCommandInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isDeviceOnline ? "Enter remote command (e.g. ls -la, systeminfo, uptime)..." : "⚠️ Host offline. Please start client.py script on your computer..."}
                        className="flex-1 bg-transparent border-none outline-none font-mono text-xs md:text-sm text-white placeholder-zinc-700"
                        disabled={!isWsConnected}
                      />

                      <div className="flex items-center gap-2 select-none">
                        <div className="hidden md:block px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-zinc-500">
                          ENTER
                        </div>
                        <button
                          onClick={() => sendCommand(commandInput)}
                          disabled={!isWsConnected || !commandInput.trim()}
                          className="px-5 py-2.5 bg-[#00F0FF] text-black font-extrabold text-xs rounded hover:bg-[#00D0FF] uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Execute</span>
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* AI GEN WIDGET - Beautiful High Density Integration */}
                  <div className="bg-[#09090B] border border-white/10 rounded-lg p-4 flex flex-col gap-3 shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wide">AI Co-Pilot Assistant</h4>
                          <p className="text-[10px] text-zinc-500">Generate perfect terminal commands using Gemini AI</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && generateAiCommand()}
                        placeholder="e.g., 'узнать свободное место', 'список сетевых подключений', 'убить процесс по имени'..."
                        className="flex-1 bg-[#050506] border border-white/10 focus:border-[#00F0FF]/30 outline-none px-3.5 py-2 rounded font-mono text-xs text-white placeholder-zinc-700"
                      />
                      <button
                        onClick={generateAiCommand}
                        disabled={isAiGenerating || !aiPrompt.trim()}
                        className="px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-900 text-white font-mono text-xs font-bold rounded cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        {isAiGenerating ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>GENERATE</span>
                      </button>
                    </div>

                    {/* AI Output Result with High Density Palette */}
                    <AnimatePresence>
                      {aiError && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="bg-red-500/10 border border-red-500/20 p-2.5 rounded text-[11px] text-red-400 font-mono flex items-center gap-2"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{aiError}</span>
                        </motion.div>
                      )}

                      {aiResult && (
                        <motion.div
                          initial={{ opacity: 0, height: "auto" }}
                          animate={{ opacity: 1 }}
                          className="bg-[#121214] border border-white/10 rounded p-3.5 flex flex-col gap-3 font-mono text-xs"
                        >
                          <div className="text-zinc-400 bg-black/30 p-3 rounded border border-white/5">
                            <span className="text-purple-400 font-bold flex items-center gap-1 mb-1">
                              <HelpCircle className="w-3.5 h-3.5" /> Explanation (Объяснение):
                            </span>
                            {aiResult.explanation}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            
                            {/* Windows CMD */}
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Windows (CMD/Powershell)</span>
                              <div className="bg-black/40 px-3 py-2 rounded flex items-center justify-between border border-white/5">
                                <code className="text-zinc-200 text-[11px] break-all">{aiResult.windows}</code>
                                <div className="flex gap-1.5 ml-2">
                                  <button
                                    onClick={() => copyAiCommand(aiResult.windows, "win")}
                                    className="p-1 hover:bg-white/5 text-zinc-400 hover:text-white rounded"
                                    title="Copy command"
                                  >
                                    {copiedAi === "win" ? <Check className="w-3.5 h-3.5 text-[#00F0FF]" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => setCommandInput(aiResult.windows)}
                                    className="p-1 hover:bg-[#00F0FF]/10 text-zinc-400 hover:text-[#00F0FF] rounded"
                                    title="Set command to input bar"
                                  >
                                    <TerminalIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Linux / Unix */}
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Unix (Linux/macOS Bash)</span>
                              <div className="bg-black/40 px-3 py-2 rounded flex items-center justify-between border border-white/5">
                                <code className="text-zinc-200 text-[11px] break-all">{aiResult.unix}</code>
                                <div className="flex gap-1.5 ml-2">
                                  <button
                                    onClick={() => copyAiCommand(aiResult.unix, "unix")}
                                    className="p-1 hover:bg-white/5 text-zinc-400 hover:text-white rounded"
                                    title="Copy command"
                                  >
                                    {copiedAi === "unix" ? <Check className="w-3.5 h-3.5 text-[#00F0FF]" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => setCommandInput(aiResult.unix)}
                                    className="p-1 hover:bg-[#00F0FF]/10 text-zinc-400 hover:text-[#00F0FF] rounded"
                                    title="Set command to input bar"
                                  >
                                    <TerminalIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: INSTRUCTION FOR CLIENT SCRIPT */}
              {currentTab === "setup" && (
                <motion.div
                  key="setup"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6"
                >
                  <div className="bg-[#050506] border border-white/10 rounded-lg p-5 md:p-6 space-y-6">
                    <div>
                      <h2 className="text-sm font-bold tracking-tight text-white uppercase flex items-center gap-2">
                        <Download className="w-4.5 h-4.5 text-[#00F0FF]" />
                        1. HOST CONFIGURATION & CLIENT SCRIPT SETUP
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Для сопряжения веб-панели с вашим ПК запустите на нем легковесный фоновый Python скрипт. Скрипт принимает только ваши зашифрованные команды и отправляет терминальный stdout.
                      </p>
                    </div>

                    {/* Step-by-step setup details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Step 1 */}
                      <div className="bg-[#121214] border border-white/5 p-4 rounded flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase bg-[#00F0FF]/10 border border-[#00F0FF]/20 px-2 py-0.5 rounded">STEP_01</span>
                          <h4 className="text-xs font-bold text-white mt-3 uppercase">Установите websockets</h4>
                          <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                            Убедитесь, что у вас установлен Python 3 и вебсокет-библиотека. Запустите в консоли ПК:
                          </p>
                        </div>
                        <div className="bg-black/40 p-2 rounded text-[11px] font-mono mt-3.5 border border-white/5 flex items-center justify-between select-all">
                          <span>pip install websockets</span>
                          <button
                            onClick={() => copyToClipboard("pip install websockets", setCopiedCmd)}
                            className="text-zinc-500 hover:text-white"
                          >
                            {copiedCmd ? <Check className="w-3.5 h-3.5 text-[#00F0FF]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="bg-[#121214] border border-white/5 p-4 rounded flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase bg-[#00F0FF]/10 border border-[#00F0FF]/20 px-2 py-0.5 rounded">STEP_02</span>
                          <h4 className="text-xs font-bold text-white mt-3 uppercase">Создайте файл client.py</h4>
                          <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                            Создайте файл <code className="text-[#00F0FF] text-[10px]">client.py</code> на вашем ПК. Скопируйте готовый код справа (настройки сопряжения уже запечены внутрь!).
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(getPythonScript(), setCopiedScript)}
                          className="mt-4 w-full py-2 bg-[#00F0FF] hover:bg-[#00D0FF] text-black font-extrabold text-xs rounded uppercase tracking-wider transition-colors cursor-pointer text-center"
                        >
                          {copiedScript ? "SCOPIED!" : "COPY SCRIPT"}
                        </button>
                      </div>

                      {/* Step 3 */}
                      <div className="bg-[#121214] border border-white/5 p-4 rounded flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-[#00F0FF] uppercase bg-[#00F0FF]/10 border border-[#00F0FF]/20 px-2 py-0.5 rounded">STEP_03</span>
                          <h4 className="text-xs font-bold text-white mt-3 uppercase">Запустите скрипт</h4>
                          <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                            Запустите скрипт на вашем устройстве. Как только соединение установится, веб-панель Remote-OS загорится статусом CONNECTED.
                          </p>
                        </div>
                        <div className="bg-black/40 p-2 rounded text-[11px] font-mono mt-3.5 border border-white/5 flex items-center justify-between select-all">
                          <span>python client.py</span>
                        </div>
                      </div>

                    </div>

                    {/* Full Code script preview */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide font-mono">
                          Prepared Script Code (client.py):
                        </span>
                        <button
                          onClick={() => copyToClipboard(getPythonScript(), setCopiedScript)}
                          className="text-xs font-mono text-[#00F0FF] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>[COPY_ALL_CODE]</span>
                        </button>
                      </div>

                      <div className="bg-black border border-white/5 rounded-lg overflow-hidden">
                        <div className="bg-[#121214] px-4 py-1.5 border-b border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-500 select-none">
                          <span>client.py (autofilled settings)</span>
                          <span className="text-[9px]">UTF-8 / python3</span>
                        </div>
                        <pre className="p-4 text-[11px] font-mono text-zinc-400 overflow-x-auto max-h-[350px] custom-scrollbar whitespace-pre select-text">
                          {getPythonScript()}
                        </pre>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* TAB 3: HISTORY */}
              {currentTab === "history" && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4"
                >
                  <div className="bg-[#050506] border border-white/10 rounded-lg p-5 md:p-6 space-y-4">
                    <div>
                      <h2 className="text-sm font-bold tracking-tight text-white uppercase flex items-center gap-2">
                        <Clock className="w-4.5 h-4.5 text-[#00F0FF]" />
                        2. SESSION RELAYED COMMANDS HISTORY
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        История команд, отправленных в рамках текущей веб-сессии. Хранится локально в кэше браузера.
                      </p>
                    </div>

                    {commandHistory.length === 0 ? (
                      <div className="bg-[#121214] border border-dashed border-white/5 p-12 rounded text-center text-zinc-500 font-mono text-xs">
                        [EMPTY] No command transmissions logged in this active session.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {commandHistory.map((item) => (
                          <div 
                            key={item.id} 
                            className="bg-[#121214] border border-white/5 rounded p-4 font-mono text-xs flex flex-col gap-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="text-zinc-600">{item.timestamp}</span>
                                <span className="text-[#00F0FF] font-bold select-none">$</span>
                                <span className="text-white font-bold select-all">{item.command}</span>
                              </div>
                              
                              <span className={`text-[9px] font-mono px-2.5 py-0.5 rounded font-extrabold border select-none uppercase ${
                                item.status === "success" 
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                  : item.status === "error"
                                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                              }`}>
                                {item.status === "success" ? "DONE" : item.status === "error" ? "ERROR" : "PENDING"}
                              </span>
                            </div>

                            {item.output && (
                              <div className="bg-black/40 p-3 rounded border border-white/5 max-h-32 overflow-y-auto custom-scrollbar">
                                <pre className="text-[11px] text-zinc-400 whitespace-pre-wrap select-text">
                                  {item.output}
                                </pre>
                              </div>
                            )}

                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setCommandInput(item.command);
                                  setCurrentTab("terminal");
                                }}
                                className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1 rounded text-zinc-300 hover:text-white transition-colors cursor-pointer uppercase"
                              >
                                Re-inject Command
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

          </div>

          {/* Bottom Footer Area - High Density Cyan Highlight */}
          <footer className="h-8 bg-[#00F0FF] flex items-center px-4 justify-between shrink-0 select-none text-black select-none">
            <div className="flex gap-6 items-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
                Encrypted P2P Session
              </span>
              <span className="hidden md:inline text-[9px] font-bold text-black/60 font-mono">
                PROTOCOL: SECURE WEBSOCKETS (GCM / RSA)
              </span>
            </div>
            <div className="flex gap-4 font-mono text-[10px]">
              <span className="font-bold">STATUS: {isWsConnected ? "CONNECTED" : "DISCONNECTED"}</span>
              <span className="hidden sm:inline text-black/50">|</span>
              <span className="font-bold">{utcTime}</span>
            </div>
          </footer>

        </main>
      </div>

      {/* SETTINGS DIALOG (MODAL) */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121214] border border-white/10 rounded-lg w-full max-w-md overflow-hidden shadow-2xl font-mono"
            >
              <div className="px-5 py-3.5 bg-[#0A0A0C] border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Settings className="w-4 h-4 text-[#00F0FF]" />
                  PAIRING INTERFACE CONFIG
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-zinc-500 hover:text-white text-xs cursor-pointer uppercase font-bold"
                >
                  CLOSE
                </button>
              </div>

              <div className="p-5 flex flex-col gap-4 text-xs">
                
                {/* Room ID setting */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex justify-between">
                    <span>Room ID (ROOM_ID)</span>
                    <span className="text-[#00F0FF] lowercase">12-char hex code</span>
                  </label>
                  <input
                    type="text"
                    value={newRoomId}
                    onChange={(e) => setNewRoomId(e.target.value)}
                    placeholder="e.g. home_server_id"
                    className="bg-black border border-white/5 focus:border-[#00F0FF]/30 outline-none px-3 py-2 rounded font-mono text-white text-xs"
                  />
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    ID комнаты разделяет сеансы. Скрипт на вашем ПК должен иметь точно такой же ID комнаты для корректной маршрутизации команд.
                  </p>
                </div>

                {/* Auth Token setting */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex justify-between">
                    <span>Authentication Secret (AUTH_TOKEN)</span>
                    <span className="text-zinc-500">PC Password</span>
                  </label>
                  <input
                    type="text"
                    value={newAuthToken}
                    onChange={(e) => setNewAuthToken(e.target.value)}
                    placeholder="Auth secret token"
                    className="bg-black border border-white/5 focus:border-[#00F0FF]/30 outline-none px-3 py-2 rounded font-mono text-white text-xs"
                  />
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Предотвращает неавторизованные запросы. Ваш ПК выполнит shell команду только при полном совпадении токена.
                  </p>
                </div>

                {/* Default random generator */}
                <button
                  onClick={resetToRandom}
                  className="text-[10px] self-start text-[#00F0FF] hover:underline font-bold uppercase cursor-pointer"
                >
                  [⚡ Generate Random Pair]
                </button>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mt-4 border-t border-white/5 pt-4">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white font-bold rounded uppercase transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applySettings}
                    className="py-2 bg-[#00F0FF] hover:bg-[#00D0FF] text-black font-extrabold rounded uppercase transition-all cursor-pointer text-center"
                  >
                    Apply Config
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
