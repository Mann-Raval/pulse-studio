import { createApp } from './app.js';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';

const app = createApp();

const server = app.listen(config.PORT, () => {
  console.log(`🚀 Pulse Studio API server listening on http://localhost:${config.PORT}`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}, closing server gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
