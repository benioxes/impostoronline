import { z } from 'zod';
import { insertLobbySchema, insertPlayerSchema, lobbies, players } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  lobbies: {
    create: {
      method: 'POST' as const,
      path: '/api/lobbies',
      input: z.object({ playerName: z.string().min(1) }),
      responses: {
        201: z.object({ lobby: z.custom<typeof lobbies.$inferSelect>(), player: z.custom<typeof players.$inferSelect>() }),
        400: errorSchemas.validation,
      },
    },
    join: {
      method: 'POST' as const,
      path: '/api/lobbies/join',
      input: z.object({ code: z.string().length(4), playerName: z.string().min(1) }),
      responses: {
        200: z.object({ lobby: z.custom<typeof lobbies.$inferSelect>(), player: z.custom<typeof players.$inferSelect>() }),
        404: errorSchemas.notFound,
      },
    },
    updateSettings: {
      method: 'PUT' as const,
      path: '/api/lobbies/:id/settings',
      input: z.object({
        numImpostors: z.number().optional(),
        category: z.string().optional(),
        word: z.string().optional(),
        hint: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof lobbies.$inferSelect>(),
        403: errorSchemas.validation, // Not host
        404: errorSchemas.notFound,
      },
    },
    startGame: {
      method: 'POST' as const,
      path: '/api/lobbies/:id/start',
      input: z.object({}), // No body needed
      responses: {
        200: z.custom<typeof lobbies.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    startVoting: {
      method: 'POST' as const,
      path: '/api/lobbies/:id/start-voting',
      input: z.object({}),
      responses: {
        200: z.custom<typeof lobbies.$inferSelect>(),
        403: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    vote: {
      method: 'POST' as const,
      path: '/api/lobbies/:id/vote',
      input: z.object({ targetId: z.number().nullable(), playerId: z.number() }), // playerId sent for verification alongside session
      responses: {
        200: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
      },
    },
    guessWord: { // Impostor guessing the word
       method: 'POST' as const,
       path: '/api/lobbies/:id/guess',
       input: z.object({ playerId: z.number(), word: z.string() }),
       responses: {
         200: z.object({ correct: z.boolean(), gameOver: z.boolean() }),
       }
    },
    nextRound: {
      method: 'POST' as const,
      path: '/api/lobbies/:id/next-round',
      input: z.object({}),
      responses: {
        200: z.custom<typeof lobbies.$inferSelect>(),
        403: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    leave: {
      method: 'POST' as const,
      path: '/api/lobbies/:id/leave',
      input: z.object({ playerId: z.number() }),
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    kick: {
      method: 'POST' as const,
      path: '/api/lobbies/:id/kick',
      input: z.object({ targetPlayerId: z.number() }),
      responses: {
        200: z.object({ success: z.boolean() }),
        403: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
