import { type Lobby, type Player, type UpdateSettingsRequest } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createLobby(hostId: string, playerName: string): Promise<{ lobby: Lobby, player: Player }>;
  joinLobby(code: string, playerName: string): Promise<{ lobby: Lobby, player: Player } | undefined>;
  getLobby(id: number): Promise<Lobby | undefined>;
  getLobbyByCode(code: string): Promise<Lobby | undefined>;
  updateLobby(id: number, updates: Partial<Lobby>): Promise<Lobby>;
  getPlayers(lobbyId: number): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  updatePlayer(id: number, updates: Partial<Player>): Promise<Player>;
  deletePlayer(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private lobbies: Map<number, Lobby>;
  private players: Map<number, Player>;
  private lobbyIdCounter = 1;
  private playerIdCounter = 1;

  constructor() {
    this.lobbies = new Map();
    this.players = new Map();
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createLobby(hostId: string, playerName: string): Promise<{ lobby: Lobby, player: Player }> {
    const lobbyId = this.lobbyIdCounter++;
    const code = this.generateCode();
    
    const lobby: Lobby = {
      id: lobbyId,
      code,
      hostId,
      status: 'waiting',
      settings: {
        numImpostors: 1,
        category: 'General',
        word: '',
        hint: ''
      },
      createdAt: new Date(),
    };
    this.lobbies.set(lobbyId, lobby);

    const playerId = this.playerIdCounter++;
    const player: Player = {
      id: playerId,
      lobbyId,
      name: playerName,
      role: null,
      isHost: true,
      socketId: null,
      hasVoted: false,
      votedFor: null
    };
    this.players.set(playerId, player);

    return { lobby, player };
  }

  async joinLobby(code: string, playerName: string): Promise<{ lobby: Lobby, player: Player } | undefined> {
    const lobby = await this.getLobbyByCode(code);
    if (!lobby) return undefined;

    const playerId = this.playerIdCounter++;
    const player: Player = {
      id: playerId,
      lobbyId: lobby.id,
      name: playerName,
      role: null,
      isHost: false,
      socketId: null,
      hasVoted: false,
      votedFor: null
    };
    this.players.set(playerId, player);

    return { lobby, player };
  }

  async getLobby(id: number): Promise<Lobby | undefined> {
    return this.lobbies.get(id);
  }

  async getLobbyByCode(code: string): Promise<Lobby | undefined> {
    return Array.from(this.lobbies.values()).find(l => l.code === code);
  }

  async updateLobby(id: number, updates: Partial<Lobby>): Promise<Lobby> {
    const lobby = await this.getLobby(id);
    if (!lobby) throw new Error("Lobby not found");
    const updated = { ...lobby, ...updates };
    this.lobbies.set(id, updated);
    return updated;
  }

  async getPlayers(lobbyId: number): Promise<Player[]> {
    return Array.from(this.players.values()).filter(p => p.lobbyId === lobbyId);
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async updatePlayer(id: number, updates: Partial<Player>): Promise<Player> {
    const player = await this.getPlayer(id);
    if (!player) throw new Error("Player not found");
    const updated = { ...player, ...updates };
    this.players.set(id, updated);
    return updated;
  }

  async deletePlayer(id: number): Promise<void> {
    this.players.delete(id);
  }
}

export const storage = new MemStorage();
