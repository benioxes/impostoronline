import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const lobbies = pgTable("lobbies", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // 4-letter join code
  hostId: text("host_id").notNull(), // Session ID or similar identifying the host
  status: text("status").notNull().default("waiting"), // waiting, playing, voting, finished
  settings: jsonb("settings").$type<{
    numImpostors: number;
    category: string;
    word: string; // The secret word (hidden from impostor)
    hint: string; // Hint for the impostor (or everyone?) - User said "hint for impostor"
  }>().notNull().default({
    numImpostors: 1,
    category: "General",
    word: "",
    hint: ""
  }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  lobbyId: integer("lobby_id").notNull(),
  name: text("name").notNull(),
  role: text("role"), // 'impostor', 'innocent' - assigned at game start
  isHost: boolean("is_host").default(false),
  socketId: text("socket_id"), // For realtime communication
  hasVoted: boolean("has_voted").default(false),
  votedFor: integer("voted_for"), // ID of player voted for, or null for skip
});

// === RELATIONS ===
export const lobbiesRelations = relations(lobbies, ({ many }) => ({
  players: many(players),
}));

export const playersRelations = relations(players, ({ one }) => ({
  lobby: one(lobbies, {
    fields: [players.lobbyId],
    references: [lobbies.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertLobbySchema = createInsertSchema(lobbies).omit({ id: true, createdAt: true, status: true });
export const insertPlayerSchema = createInsertSchema(players).omit({ id: true, role: true, hasVoted: true, votedFor: true });

// === EXPLICIT API CONTRACT TYPES ===
export type Lobby = typeof lobbies.$inferSelect;
export type Player = typeof players.$inferSelect;

export type CreateLobbyRequest = {
  playerName: string;
};

export type JoinLobbyRequest = {
  code: string;
  playerName: string;
};

export type UpdateSettingsRequest = {
  numImpostors?: number;
  category?: string;
  word?: string;
  hint?: string;
};

export type VoteRequest = {
  targetId: number | null; // null means skip
};

export type GameStateResponse = {
  lobby: Lobby;
  players: Player[];
  me: Player | undefined;
};

// WebSocket Event Types
export const WS_EVENTS = {
  LOBBY_UPDATE: 'lobby_update', // Player joined/left, settings changed
  GAME_START: 'game_start', // Roles assigned
  VOTE_UPDATE: 'vote_update', // Someone voted
  GAME_OVER: 'game_over', // Game ended
  ERROR: 'error'
} as const;
