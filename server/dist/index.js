"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_js_1 = require("./app.js");
const index_js_1 = require("./config/index.js");
const prisma_js_1 = require("./lib/prisma.js");
const index_js_2 = require("./socket/index.js");
const app = (0, app_js_1.createApp)();
const server = http_1.default.createServer(app);
// Initialize Socket.io real-time engine
(0, index_js_2.initSocketServer)(server);
server.listen(index_js_1.config.PORT, () => {
    console.log(`🚀 Pulse Studio API server listening on http://localhost:${index_js_1.config.PORT}`);
    console.log(`📡 WebSocket server initialized on same port`);
    console.log(`📊 Environment: ${index_js_1.config.NODE_ENV}`);
});
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}, closing server gracefully...`);
    server.close(async () => {
        console.log('HTTP and WebSocket server closed.');
        await prisma_js_1.prisma.$disconnect();
        console.log('Database connection closed.');
        process.exit(0);
    });
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
