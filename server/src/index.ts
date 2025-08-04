
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import { 
  createTableDefinitionInputSchema, 
  updateTableDefinitionInputSchema,
  generateSqlInputSchema
} from './schema';
import { createTableDefinition } from './handlers/create_table_definition';
import { getTableDefinitions } from './handlers/get_table_definitions';
import { getTableDefinitionById } from './handlers/get_table_definition_by_id';
import { updateTableDefinition } from './handlers/update_table_definition';
import { deleteTableDefinition } from './handlers/delete_table_definition';
import { generateSqlFromShorthand } from './handlers/generate_sql_from_shorthand';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new table definition
  createTableDefinition: publicProcedure
    .input(createTableDefinitionInputSchema)
    .mutation(({ input }) => createTableDefinition(input)),
  
  // Get all table definitions
  getTableDefinitions: publicProcedure
    .query(() => getTableDefinitions()),
  
  // Get a specific table definition by ID
  getTableDefinitionById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getTableDefinitionById(input.id)),
  
  // Update a table definition
  updateTableDefinition: publicProcedure
    .input(updateTableDefinitionInputSchema)
    .mutation(({ input }) => updateTableDefinition(input)),
  
  // Delete a table definition
  deleteTableDefinition: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTableDefinition(input.id)),
  
  // Generate SQL from shorthand without storing (for preview)
  generateSqlFromShorthand: publicProcedure
    .input(generateSqlInputSchema)
    .query(({ input }) => generateSqlFromShorthand(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
