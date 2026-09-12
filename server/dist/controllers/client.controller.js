"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = exports.listClients = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const listClients = async (_req, res, next) => {
    try {
        const clients = await prisma_js_1.prisma.client.findMany({
            include: {
                _count: {
                    select: { projects: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        res.status(200).json({ clients });
    }
    catch (error) {
        next(error);
    }
};
exports.listClients = listClients;
const createClient = async (req, res, next) => {
    try {
        const { name } = req.body;
        const normalizedName = String(name).trim();
        const client = await prisma_js_1.prisma.client.create({
            data: {
                name: normalizedName,
            },
            include: {
                _count: {
                    select: { projects: true },
                },
            },
        });
        res.status(201).json({ client });
    }
    catch (error) {
        next(error);
    }
};
exports.createClient = createClient;
