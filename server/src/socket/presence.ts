import { Role } from '@prisma/client';
import { PresenceUser, PresenceUpdatePayload } from '../types/socket.js';

interface ConnectedUserInfo {
  user: PresenceUser;
  connectionCount: number;
}

class PresenceManager {
  // Map of userId -> ConnectedUserInfo
  private users = new Map<string, ConnectedUserInfo>();

  /**
   * Register a new socket connection for a user.
   * Returns true if this is the user's first active connection (went online).
   */
  public addConnection(user: PresenceUser): boolean {
    const existing = this.users.get(user.id);
    if (existing) {
      existing.connectionCount += 1;
      return false;
    } else {
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
  public removeConnection(userId: string): boolean {
    const existing = this.users.get(userId);
    if (!existing) return false;

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
  public getOnlineUsers(): PresenceUser[] {
    return Array.from(this.users.values()).map((info) => info.user);
  }

  /**
   * Get the current count of online distinct users.
   */
  public getOnlineCount(): number {
    return this.users.size;
  }

  /**
   * Get full presence payload.
   */
  public getPresencePayload(): PresenceUpdatePayload {
    return {
      count: this.getOnlineCount(),
      users: this.getOnlineUsers(),
    };
  }

  /**
   * Check if a specific user is currently online.
   */
  public isUserOnline(userId: string): boolean {
    return this.users.has(userId);
  }
}

export const presenceManager = new PresenceManager();
