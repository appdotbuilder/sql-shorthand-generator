
import { z } from 'zod';

// mTable schema for storing shorthand table definitions
export const mTableSchema = z.object({
  id: z.number(),
  name: z.string(),
  shorthand_definition: z.string(),
  generated_sql: z.string(),
  created_at: z.coerce.date()
});

export type MTable = z.infer<typeof mTableSchema>;

// Input schema for creating table definitions
export const createTableDefinitionInputSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  shorthand_definition: z.string().min(1, "Shorthand definition is required")
});

export type CreateTableDefinitionInput = z.infer<typeof createTableDefinitionInputSchema>;

// Input schema for updating table definitions
export const updateTableDefinitionInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  shorthand_definition: z.string().min(1).optional()
});

export type UpdateTableDefinitionInput = z.infer<typeof updateTableDefinitionInputSchema>;

// Schema for generating SQL from shorthand
export const generateSqlInputSchema = z.object({
  table_name: z.string().min(1, "Table name is required"),
  shorthand_definition: z.string().min(1, "Shorthand definition is required")
});

export type GenerateSqlInput = z.infer<typeof generateSqlInputSchema>;

// Schema for SQL generation result
export const sqlGenerationResultSchema = z.object({
  table_name: z.string(),
  shorthand_definition: z.string(),
  generated_sql: z.string()
});

export type SqlGenerationResult = z.infer<typeof sqlGenerationResultSchema>;
