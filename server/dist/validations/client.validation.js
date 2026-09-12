"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClientSchema = void 0;
const zod_1 = require("zod");
exports.createClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Client name must be at least 2 characters'),
});
