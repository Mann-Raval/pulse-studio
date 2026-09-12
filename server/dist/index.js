"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = require("./app.js");
const index_js_1 = require("./config/index.js");
const prisma_js_1 = require("./lib/prisma.js");
const app = (0, app_js_1.createApp)();
const server = app.listen(index_js_1.config.PORT, () => {
    console.log(`🚀 Pulse Studio API server listening on http://localhost:${index_js_1.config.PORT}`);
    console.log(`📊 Environment: ${index_js_1.config.NODE_ENV}`);
});
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}, closing server gracefully...`);
    server.close(async () => {
        console.log('HTTP server closed.');
        await prisma_js_1.prisma.$disconnect();
        console.log('Database connection closed.');
        process.exit(0);
    });
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
