import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type GameStateResponse, type CreateLobbyRequest, type JoinLobbyRequest, type UpdateSettingsRequest, type VoteRequest } from "@shared/routes";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { type Lobby, type Player, WS_EVENTS } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Helper to get persistent player ID
const getPlayerId = () => {
  const stored = localStorage.getItem("impostor_player_id");
  return stored ? parseInt(stored, 10) : null;
};

const setPlayerId = (id: number) => {
  localStorage.setItem("impostor_player_id", id.toString());
};

// ============================================
// GAME DATA HOOKS
// ============================================

export function useGameState(lobbyCode: string) {
  const playerId = getPlayerId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Basic polling for now since we are simulating WS in MVP
  // In a real app, this would be a WS subscription
  const query = useQuery({
    queryKey: [api.lobbies.join.path, lobbyCode],
    queryFn: async () => {
      // We simulate a "get game state" by re-joining or hitting a status endpoint
      // For this specific API design, we can assume there's a GET endpoint or we use the join endpoint
      // effectively as a "get state" if we already have a player ID.
      // However, strict REST would imply a GET /api/lobbies/:code. 
      // Given the manifest, we'll try to fetch the lobby state.
      // Since the manifest uses POST for join and create, but doesn't explicitly list a GET for state,
      // We'll mock the data fetching or assume we need to implement a poller.
      
      // NOTE: For this generated code to work best with the provided manifest, 
      // I will implement a fetch that reconstructs what we need, 
      // assuming the backend route structure allows fetching lobby state.
      // If strict manifest adherence is required, we might struggle without a GET endpoint.
      // Assuming a standard GET pattern:
      
      const res = await fetch(`/api/lobbies/${lobbyCode}/state?playerId=${playerId}`);
      if (!res.ok) throw new Error("Failed to fetch game state");
      return await res.json() as GameStateResponse;
    },
    enabled: !!lobbyCode && !!playerId,
    refetchInterval: 1000, // Polling every second for "real-time" feel in MVP
  });

  return query;
}

export function useCreateLobby() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateLobbyRequest) => {
      const res = await fetch(api.lobbies.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create lobby");
      return api.lobbies.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      setPlayerId(data.player.id);
      setLocation(`/game/${data.lobby.code}`);
      toast({ title: "Lobby Created!", description: `Share code ${data.lobby.code} with friends.` });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}

export function useJoinLobby() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: JoinLobbyRequest) => {
      const res = await fetch(api.lobbies.join.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to join lobby");
      return api.lobbies.join.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      setPlayerId(data.player.id);
      setLocation(`/game/${data.lobby.code}`);
      toast({ title: "Joined!", description: "Welcome to the game." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ lobbyId, ...settings }: { lobbyId: number } & UpdateSettingsRequest) => {
      const url = buildUrl(api.lobbies.updateSettings.path, { id: lobbyId });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return api.lobbies.updateSettings.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.lobbies.join.path] }); // Invalidate game state
      toast({ title: "Settings Updated" });
    },
  });
}

export function useStartGame() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (lobbyId: number) => {
      const url = buildUrl(api.lobbies.startGame.path, { id: lobbyId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to start game");
      return api.lobbies.startGame.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.lobbies.join.path] });
      toast({ title: "Game Started!", description: "Check your role carefully." });
    },
  });
}

export function useVote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ lobbyId, targetId }: { lobbyId: number, targetId: number | null }) => {
      const url = buildUrl(api.lobbies.vote.path, { id: lobbyId });
      const playerId = getPlayerId();
      if (!playerId) throw new Error("No player ID found");
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, playerId }),
      });
      if (!res.ok) throw new Error("Failed to cast vote");
      return api.lobbies.vote.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.lobbies.join.path] });
      toast({ title: "Vote Cast", description: "Waiting for others..." });
    },
  });
}

export function useGuessWord() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ lobbyId, word }: { lobbyId: number, word: string }) => {
      const url = buildUrl(api.lobbies.guessWord.path, { id: lobbyId });
      const playerId = getPlayerId();
      if (!playerId) throw new Error("No player ID found");

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, word }),
      });
      
      if (!res.ok) throw new Error("Failed to submit guess");
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.lobbies.join.path] });
      if (data.correct) {
        toast({ title: "CORRECT!", description: "You won the game!", className: "bg-green-500 text-white" });
      } else {
        toast({ title: "WRONG!", description: "That was not the word.", variant: "destructive" });
      }
    }
  });
}
