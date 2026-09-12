import http from 'http';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';
import { initSocketServer } from './socket/index.js';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.io real-time engine
initSocketServer(server);

server.listen(config.PORT, () => {
  console.log(`🚀 Pulse Studio API server listening on http://localhost:${config.PORT}`);
  console.log(`📡 WebSocket server initialized on same port`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}, closing server gracefully...`);
  server.close(async () => {
    console.log('HTTP and WebSocket server closed.');
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

