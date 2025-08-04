
import { db } from '../db';
import { mTableTable } from '../db/schema';
import { type CreateTableDefinitionInput, type MTable } from '../schema';

export async function createTableDefinition(input: CreateTableDefinitionInput): Promise<MTable> {
  try {
    const generatedSql = generateSqlFromShorthand(input.name, input.shorthand_definition);
    
    const result = await db.insert(mTableTable)
      .values({
        name: input.name,
        shorthand_definition: input.shorthand_definition,
        generated_sql: generatedSql
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Table definition creation failed:', error);
    throw error;
  }
}

function generateSqlFromShorthand(tableName: string, shorthand: string): string {
  const columns: string[] = [];
  
  // Split shorthand by commas and process each column definition
  const columnDefs = shorthand.split(',').map(def => def.trim()).filter(def => def.length > 0);
  
  for (const columnDef of columnDefs) {
    const column = parseColumnDefinition(columnDef);
    columns.push(column);
  }
  
  // If no columns defined or no id column, add default id column
  const hasIdColumn = columns.some(col => col.includes('id ') || col.startsWith('id '));
  if (!hasIdColumn) {
    columns.unshift('  id SERIAL PRIMARY KEY');
  }
  
  return `CREATE TABLE ${tableName} (\n${columns.join(',\n')}\n);`;
}

function parseColumnDefinition(def: string): string {
  const parts = def.split(' ').filter(part => part.length > 0);
  if (parts.length === 0) return '';
  
  const columnName = parts[0];
  const typeAndModifiers = parts.slice(1).join(' ');
  
  // Handle special shorthand types
  if (typeAndModifiers === 'id') {
    return `  ${columnName} SERIAL PRIMARY KEY`;
  }
  
  if (typeAndModifiers === 't') {
    return `  ${columnName} TEXT NOT NULL DEFAULT ''`;
  }
  
  if (typeAndModifiers === 'tn') {
    return `  ${columnName} TEXT NULL`;
  }
  
  if (typeAndModifiers === 'i') {
    return `  ${columnName} INT NOT NULL DEFAULT 0`;
  }
  
  if (typeAndModifiers === 'in') {
    return `  ${columnName} INT NULL`;
  }
  
  if (typeAndModifiers === 'tz') {
    return `  ${columnName} TIMESTAMPTZ NULL`;
  }
  
  if (typeAndModifiers === 'tzn') {
    return `  ${columnName} TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
  }
  
  // Handle default values - look for 'd' followed by quoted value
  if (typeAndModifiers.includes(" d '")) {
    const baseType = typeAndModifiers.split(" d '")[0];
    const defaultValue = typeAndModifiers.split(" d '")[1].replace("'", "");
    
    let sqlType = 'TEXT';
    if (baseType === 'i' || baseType === 'in') {
      sqlType = 'INT';
    }
    
    const nullable = baseType.endsWith('n') ? 'NULL' : 'NOT NULL';
    return `  ${columnName} ${sqlType} ${nullable} DEFAULT '${defaultValue}'`;
  }
  
  // Default case - treat as raw SQL column definition
  return `  ${columnName} ${typeAndModifiers}`;
}
