
import { type GenerateSqlInput, type SqlGenerationResult } from '../schema';

export async function generateSqlFromShorthand(input: GenerateSqlInput): Promise<SqlGenerationResult> {
  try {
    const generatedSql = parseShorthandToSql(input.table_name, input.shorthand_definition);
    
    return {
      table_name: input.table_name,
      shorthand_definition: input.shorthand_definition,
      generated_sql: generatedSql
    };
  } catch (error) {
    console.error('SQL generation failed:', error);
    throw error;
  }
}

function parseShorthandToSql(tableName: string, shorthand: string): string {
  const lines = shorthand.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const columns: string[] = [];
  
  for (const line of lines) {
    const columnDef = parseColumnDefinition(line);
    if (columnDef) {
      columns.push(columnDef);
    }
  }
  
  if (columns.length === 0) {
    throw new Error('No valid column definitions found');
  }
  
  const columnsString = columns.map(col => `  ${col}`).join(',\n');
  return `CREATE TABLE ${tableName} (\n${columnsString}\n);`;
}

function parseColumnDefinition(line: string): string | null {
  // Parse format: column_name:type [default_value]
  const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.+)$/);
  if (!match) {
    return null;
  }
  
  const columnName = match[1];
  const typeAndDefault = match[2].trim();
  
  // Split type and default value
  const parts = typeAndDefault.split(/\s+/);
  const type = parts[0];
  const defaultPart = parts.slice(1).join(' ');
  
  return buildColumnDefinition(columnName, type, defaultPart);
}

function buildColumnDefinition(columnName: string, type: string, defaultPart: string): string {
  let sqlType: string;
  let nullable = true;
  let defaultValue = '';
  let isPrimaryKey = false;
  
  switch (type) {
    case 'id':
      sqlType = 'SERIAL';
      nullable = false;
      isPrimaryKey = true;
      break;
    case 't':
      sqlType = 'TEXT';
      nullable = false;
      defaultValue = "DEFAULT ''";
      break;
    case 'tn':
      sqlType = 'TEXT';
      nullable = true;
      break;
    case 'i':
      sqlType = 'INTEGER';
      nullable = false;
      defaultValue = 'DEFAULT 0';
      break;
    case 'in':
      sqlType = 'INTEGER';
      nullable = true;
      break;
    case 'tz':
      sqlType = 'TIMESTAMPTZ';
      nullable = true;
      break;
    case 'tzn':
      sqlType = 'TIMESTAMPTZ';
      nullable = false;
      defaultValue = 'DEFAULT NOW()';
      break;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
  
  // Handle custom default values (format: d 'value')
  if (defaultPart.startsWith("d ")) {
    const customDefault = defaultPart.substring(2).trim();
    defaultValue = `DEFAULT ${customDefault}`;
  }
  
  // Build the column definition
  let definition = `${columnName} ${sqlType}`;
  
  if (isPrimaryKey) {
    definition += ' PRIMARY KEY';
  } else {
    if (!nullable) {
      definition += ' NOT NULL';
    }
    if (defaultValue) {
      definition += ` ${defaultValue}`;
    }
  }
  
  return definition;
}
