"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRefreshTokenCookie = exports.setRefreshTokenCookie = exports.getRefreshTokenCookieOptions = exports.hashToken = exports.generateRefreshTokenString = exports.verifyAccessToken = exports.generateAccessToken = exports.REFRESH_COOKIE_NAME = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../config/index.js");
exports.REFRESH_COOKIE_NAME = 'refreshToken';
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, index_js_1.config.JWT_ACCESS_SECRET, {
        expiresIn: index_js_1.config.JWT_ACCESS_EXPIRES_IN,
    });
};
exports.generateAccessToken = generateAccessToken;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, index_js_1.config.JWT_ACCESS_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
const generateRefreshTokenString = () => {
    return crypto_1.default.randomBytes(48).toString('hex');
};
exports.generateRefreshTokenString = generateRefreshTokenString;
const hashToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
exports.hashToken = hashToken;
const getRefreshTokenCookieOptions = () => {
    const isProduction = index_js_1.config.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: index_js_1.config.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
        path: '/api/auth',
    };
};
exports.getRefreshTokenCookieOptions = getRefreshTokenCookieOptions;
const setRefreshTokenCookie = (res, token) => {
    res.cookie(exports.REFRESH_COOKIE_NAME, token, (0, exports.getRefreshTokenCookieOptions)());
};
exports.setRefreshTokenCookie = setRefreshTokenCookie;
const clearRefreshTokenCookie = (res) => {
    const isProduction = index_js_1.config.NODE_ENV === 'production';
    res.clearCookie(exports.REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        path: '/api/auth',
    });
};
exports.clearRefreshTokenCookie = clearRefreshTokenCookie;
