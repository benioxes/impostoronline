import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { WS_EVENTS } from "@shared/schema";
import { z } from "zod";
import { WORD_CATEGORIES } from "./words";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // WebSocket Setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Map to track active connections
  const clients = new Map<number, WebSocket>();

  function broadcast(lobbyId: number, type: string, payload: any) {
    storage.getPlayers(lobbyId).then(players => {
      players.forEach(player => {
        const client = clients.get(player.id);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type, payload }));
        }
      });
    });
  }

  wss.on('connection', (ws) => {
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join') {
           const { playerId } = message;
           if (playerId) {
             const player = await storage.getPlayer(playerId);
             if (player) {
               clients.set(playerId, ws);
               // Send initial state
               const lobby = await storage.getLobby(player.lobbyId);
               const players = await storage.getPlayers(player.lobbyId);
               ws.send(JSON.stringify({ 
                 type: WS_EVENTS.LOBBY_UPDATE, 
                 payload: { lobby, players, me: player } 
               }));
             }
           }
        }
      } catch (e) {
        console.error('WS Error:', e);
      }
    });

    ws.on('close', () => {
      // Clean up client connection
      // We don't remove the player from the game immediately to allow reconnects
    });
  });

  // REST API Routes

  app.post(api.lobbies.create.path, async (req, res) => {
    try {
      const { playerName } = api.lobbies.create.input.parse(req.body);
      const hostId = (req as any).sessionID || 'host-' + Date.now();
      const { lobby, player } = await storage.createLobby(hostId, playerName);
      res.status(201).json({ lobby, player });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: 'Internal Server Error' });
      }
    }
  });

  app.post(api.lobbies.join.path, async (req, res) => {
    try {
      const { code, playerName } = api.lobbies.join.input.parse(req.body);
      const result = await storage.joinLobby(code.toUpperCase(), playerName);
      if (!result) {
        return res.status(404).json({ message: 'Lobby not found' });
      }
      
      // Notify others
      broadcast(result.lobby.id, WS_EVENTS.LOBBY_UPDATE, { 
        lobby: result.lobby, 
        players: await storage.getPlayers(result.lobby.id) 
      });

      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: 'Internal Server Error' });
      }
    }
  });

  // GET endpoint to fetch lobby state by code
  app.get('/api/lobbies/:code/state', async (req, res) => {
    try {
      const code = req.params.code.toUpperCase();
      const playerId = req.query.playerId ? parseInt(req.query.playerId as string) : null;
      
      const lobby = await storage.getLobbyByCode(code);
      if (!lobby) {
        return res.status(404).json({ message: 'Gra nie znaleziona' });
      }

      const players = await storage.getPlayers(lobby.id);
      const me = playerId ? await storage.getPlayer(playerId) : undefined;

      res.json({ lobby, players, me });
    } catch (err) {
      console.error('Error fetching lobby state:', err);
      res.status(500).json({ message: 'Błąd wewnętrzny serwera' });
    }
  });

  app.put(api.lobbies.updateSettings.path, async (req, res) => {
    const lobbyId = parseInt(req.params.id);
    const lobby = await storage.getLobby(lobbyId);
    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });

    // In a real app, verify host. For MVP, we trust the client provided host check or similar
    // We can check if the requester is the host via session, but we kept it simple.
    
    const settings = api.lobbies.updateSettings.input.parse(req.body);
    const updatedLobby = await storage.updateLobby(lobbyId, { 
      settings: { ...lobby.settings, ...settings } 
    });

    broadcast(lobbyId, WS_EVENTS.LOBBY_UPDATE, { 
      lobby: updatedLobby, 
      players: await storage.getPlayers(lobbyId) 
    });

    res.json(updatedLobby);
  });

  app.post(api.lobbies.startGame.path, async (req, res) => {
    const lobbyId = parseInt(req.params.id);
    const lobby = await storage.getLobby(lobbyId);
    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });

    const players = await storage.getPlayers(lobbyId);
    if (players.length < 2) return res.status(400).json({ message: 'Not enough players' });

    // Assign Roles
    const numImpostors = Math.min(lobby.settings.numImpostors, Math.floor(players.length / 2));
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    
    const impostors = shuffled.slice(0, numImpostors);
    const innocents = shuffled.slice(numImpostors);

    // Get random word and hint
    const allCategories = Object.keys(WORD_CATEGORIES);
    const randomCat = allCategories[Math.floor(Math.random() * allCategories.length)];
    const words = WORD_CATEGORIES[randomCat];
    const randomWordObj = words[Math.floor(Math.random() * words.length)];
    const secretWord = randomWordObj.word;
    const hint = randomWordObj.hint;

    // Assign words/hints
    for (const p of impostors) {
      await storage.updatePlayer(p.id, { 
        role: 'impostor', 
        hasVoted: false, 
        votedFor: null,
        word: lobby.settings.giveHint ? hint : ''
      });
    }
    for (const p of innocents) {
      await storage.updatePlayer(p.id, { 
        role: 'innocent', 
        hasVoted: false, 
        votedFor: null,
        word: secretWord
      });
    }

    const updatedLobby = await storage.updateLobby(lobbyId, { status: 'playing' });
    
    players.forEach(async (p) => {
      const client = clients.get(p.id);
      if (client && client.readyState === WebSocket.OPEN) {
        const player = await storage.getPlayer(p.id); // refreshed role
        client.send(JSON.stringify({ 
          type: WS_EVENTS.GAME_START, 
          payload: { lobby: updatedLobby, players: await storage.getPlayers(lobbyId), me: player } 
        }));
      }
    });

    res.json(updatedLobby);
  });

  app.post(api.lobbies.vote.path, async (req, res) => {
    const lobbyId = parseInt(req.params.id);
    const { targetId, playerId } = api.lobbies.vote.input.parse(req.body);
    
    const player = await storage.getPlayer(playerId);
    if (!player || player.lobbyId !== lobbyId) return res.status(403).json({ message: 'Invalid player' });
    if (player.hasVoted) return res.status(400).json({ message: 'Already voted' });

    await storage.updatePlayer(playerId, { hasVoted: true, votedFor: targetId });

    // Check if everyone voted
    const players = await storage.getPlayers(lobbyId);
    const allVoted = players.every(p => p.hasVoted);

    if (allVoted) {
      // Tally votes
      const votes: Record<string, number> = {};
      let skips = 0;
      players.forEach(p => {
        if (p.votedFor === null) skips++;
        else votes[p.votedFor] = (votes[p.votedFor] || 0) + 1;
      });

      // Find max
      let maxVotes = 0;
      let target: string | null = null;
      Object.entries(votes).forEach(([pid, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          target = pid;
        } else if (count === maxVotes) {
          target = null; // Tie
        }
      });

      // Logic: If skips > maxVotes -> Skip.
      // If Tie -> Skip (or revote, but let's skip for MVP)
      
      let ejectedId: number | null = null;
      let gameOver = false;
      let winner = null;

      if (target && maxVotes > skips) {
        ejectedId = parseInt(target);
        const ejectedPlayer = await storage.getPlayer(ejectedId);
        
        if (ejectedPlayer?.role === 'impostor') {
           // Impostor ejected -> Innocents win (assuming 1 impostor for MVP)
           gameOver = true;
           winner = 'innocent';
        } else {
           // Innocent ejected -> Impostor wins (or game continues)
           // For MVP, keep it simple. Ejecting innocent might not end game instantly unless 1:1.
           // Let's say if Impostors >= Innocents, Impostor wins.
           const activeImpostors = players.filter(p => p.id !== ejectedId && p.role === 'impostor').length;
           const activeInnocents = players.filter(p => p.id !== ejectedId && p.role === 'innocent').length;
           if (activeImpostors >= activeInnocents) {
             gameOver = true;
             winner = 'impostor';
           }
        }
        // Actually remove player? Or just mark dead? 
        // For MVP, "ejected" usually means removed from lobby or marked dead.
        // Let's just mark game over if someone is ejected as per user "someone is voted out".
        // Wait user said "game ends if ... someone is voted out".
        // So ANY ejection ends game?
        // "and game ends if impostor guesses password OR someone is voted out"
        // This implies sudden death. If you vote WRONG -> you lose? 
        // If you vote RIGHT -> you win?
        // Let's implement that.
        gameOver = true;
        winner = ejectedPlayer?.role === 'impostor' ? 'innocent' : 'impostor';
      } else {
        // Skipped
        // Reset votes and continue playing
        for (const p of players) {
          await storage.updatePlayer(p.id, { hasVoted: false, votedFor: null });
        }
      }

      const updatedLobby = gameOver 
        ? await storage.updateLobby(lobbyId, { status: 'finished' }) 
        : await storage.getLobby(lobbyId); // Refresh

      broadcast(lobbyId, WS_EVENTS.GAME_OVER, { 
        lobby: updatedLobby, 
        players: await storage.getPlayers(lobbyId),
        ejectedId,
        winner,
        reason: ejectedId ? 'vote' : 'skip'
      });

    } else {
       // Just notify vote update
       broadcast(lobbyId, WS_EVENTS.VOTE_UPDATE, { 
         players: await storage.getPlayers(lobbyId) 
       });
    }

    res.json({ success: true });
  });
  
  app.post(api.lobbies.guessWord.path, async (req, res) => {
     const lobbyId = parseInt(req.params.id);
     const { playerId, word } = api.lobbies.guessWord.input.parse(req.body);
     const lobby = await storage.getLobby(lobbyId);
     const player = await storage.getPlayer(playerId);

     if (!lobby || !player || player.role !== 'impostor') {
        return res.status(403).json({ message: 'Not allowed' });
     }

     const isCorrect = word.toLowerCase().trim() === lobby.settings.word.toLowerCase().trim();
     
     if (isCorrect) {
        // Impostor Wins
        const updatedLobby = await storage.updateLobby(lobbyId, { status: 'finished' });
        broadcast(lobbyId, WS_EVENTS.GAME_OVER, {
           lobby: updatedLobby,
           players: await storage.getPlayers(lobbyId),
           winner: 'impostor',
           reason: 'guess'
        });
     }
     
     res.json({ correct: isCorrect, gameOver: isCorrect });
  });

  return httpServer;
}
