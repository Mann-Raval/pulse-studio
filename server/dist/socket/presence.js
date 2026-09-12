"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presenceManager = void 0;
class PresenceManager {
    // Map of userId -> ConnectedUserInfo
    users = new Map();
    /**
     * Register a new socket connection for a user.
     * Returns true if this is the user's first active connection (went online).
     */
    addConnection(user) {
        const existing = this.users.get(user.id);
        if (existing) {
            existing.connectionCount += 1;
            return false;
        }
        else {
            this.users.set(user.id, {
                user,
                connectionCount: 1,
            });
            return true;
        }
    }
    /**
     * Deregister a socket connection for a user.
     * Returns true if the user has no remaining active connections (went offline).
     */
    removeConnection(userId) {
        const existing = this.users.get(userId);
        if (!existing)
            return false;
        existing.connectionCount -= 1;
        if (existing.connectionCount <= 0) {
            this.users.delete(userId);
            return true;
        }
        return false;
    }
    /**
     * Get the list of currently connected distinct users.
     */
    getOnlineUsers() {
        return Array.from(this.users.values()).map((info) => info.user);
    }
    /**
     * Get the current count of online distinct users.
     */
    getOnlineCount() {
        return this.users.size;
    }
    /**
     * Get full presence payload.
     */
    getPresencePayload() {
        return {
            count: this.getOnlineCount(),
            users: this.getOnlineUsers(),
        };
    }
    /**
     * Check if a specific user is currently online.
     */
    isUserOnline(userId) {
        return this.users.has(userId);
    }
}
exports.presenceManager = new PresenceManager();
