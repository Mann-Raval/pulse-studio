export type ServerRole = 'ADMIN' | 'PM' | 'DEVELOPER';
export type UserRole = 'Admin' | 'PM' | 'Developer' | 'Lead' | ServerRole;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  pod?: string;
  cluster?: string;
  status?: 'online' | 'offline' | 'busy';
  createdAt?: string;
}
