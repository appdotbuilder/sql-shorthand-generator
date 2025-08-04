
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { MTable, CreateTableDefinitionInput, SqlGenerationResult } from '../../server/src/schema';

function App() {
  const [savedTables, setSavedTables] = useState<MTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for creating new table definitions
  const [formData, setFormData] = useState<CreateTableDefinitionInput>({
    name: '',
    shorthand_definition: ''
  });
  
  // Preview state
  const [previewResult, setPreviewResult] = useState<SqlGenerationResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Load saved table definitions
  const loadSavedTables = useCallback(async () => {
    try {
      setError(null);
      const result = await trpc.getTableDefinitions.query();
      setSavedTables(result);
    } catch (error) {
      console.error('Failed to load saved tables:', error);
      setError('Failed to load saved table definitions');
    }
  }, []);

  useEffect(() => {
    loadSavedTables();
  }, [loadSavedTables]);

  // Preview SQL generation without saving
  const handlePreview = async () => {
    if (!formData.name.trim() || !formData.shorthand_definition.trim()) {
      setError('Please provide both table name and shorthand definition');
      return;
    }
    
    setIsPreviewLoading(true);
    setError(null);
    try {
      const result = await trpc.generateSqlFromShorthand.query({
        table_name: formData.name,
        shorthand_definition: formData.shorthand_definition
      });
      setPreviewResult(result);
    } catch (error) {
      console.error('Failed to preview SQL:', error);
      setError('Failed to generate SQL preview');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Save table definition
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.shorthand_definition.trim()) {
      setError('Please provide both table name and shorthand definition');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await trpc.createTableDefinition.mutate(formData);
      setSavedTables((prev: MTable[]) => [...prev, result]);
      setFormData({
        name: '',
        shorthand_definition: ''
      });
      setPreviewResult(null);
    } catch (error) {
      console.error('Failed to save table definition:', error);
      setError('Failed to save table definition');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete table definition
  const handleDelete = async (id: number) => {
    try {
      setError(null);
      await trpc.deleteTableDefinition.mutate({ id });
      setSavedTables((prev: MTable[]) => prev.filter(table => table.id !== id));
    } catch (error) {
      console.error('Failed to delete table definition:', error);
      setError('Failed to delete table definition');
    }
  };

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      setFormData((prev: CreateTableDefinitionInput) => ({
        ...prev,
        shorthand_definition: text
      }));
      setError(null);
    } catch (error) {
      console.error('Failed to read file:', error);
      setError('Failed to read file content');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🗃️ SQL Table Generator
          </h1>
          <p className="text-lg text-gray-600">
            Create PostgreSQL tables using intuitive shorthand notation
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">✨ Create Table</TabsTrigger>
            <TabsTrigger value="saved">📚 Saved Tables</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚡ Quick Start
                </CardTitle>
                <CardDescription>
                  Use our shorthand notation to quickly define table structures
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Shorthand Reference */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">📝 Shorthand Reference:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><Badge variant="outline">id</Badge> → INTEGER PRIMARY KEY (auto-increment)</div>
                    <div><Badge variant="outline">t</Badge> → TEXT NOT NULL DEFAULT ''</div>
                    <div><Badge variant="outline">tn</Badge> → TEXT NULL</div>
                    <div><Badge variant="outline">i</Badge> → INT NOT NULL DEFAULT 0</div>
                    <div><Badge variant="outline">in</Badge> → INT NULL</div>
                    <div><Badge variant="outline">tz</Badge> → TIMESTAMPTZ NULL</div>
                    <div><Badge variant="outline">tzn</Badge> → TIMESTAMPTZ NOT NULL DEFAULT NOW()</div>
                    <div className="md:col-span-2"><Badge variant="outline">d 'value'</Badge> → Sets default value (e.g., d 'August')</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="table-name">Table Name</Label>
                    <Input
                      id="table-name"
                      placeholder="e.g., users, products, orders"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateTableDefinitionInput) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file-upload">📁 Or Upload File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shorthand">Shorthand Definition</Label>
                  <Textarea
                    id="shorthand"
                    placeholder="Example:&#10;id&#10;name t&#10;email t&#10;age in&#10;created_at tzn"
                    value={formData.shorthand_definition}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateTableDefinitionInput) => ({ ...prev, shorthand_definition: e.target.value }))
                    }
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handlePreview}
                    disabled={isPreviewLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    {isPreviewLoading ? 'Generating...' : '👁️ Preview SQL'}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Saving...' : '💾 Save Definition'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SQL Preview */}
            {previewResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🔍 Generated SQL Preview
                  </CardTitle>
                  <CardDescription>
                    PostgreSQL CREATE TABLE statement for "{previewResult.table_name}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {previewResult.generated_sql}
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📚 Saved Table Definitions
                </CardTitle>
                <CardDescription>
                  Your stored table definitions and generated SQL
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedTables.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-gray-500 text-lg">No saved table definitions yet</p>
                    <p className="text-gray-400">Create your first table definition to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedTables.map((table: MTable) => (
                      <Card key={table.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{table.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {table.created_at.toLocaleDateString()}
                              </Badge>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    🗑️ Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Table Definition</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the table definition for "{table.name}"? 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(table.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Shorthand Definition:</Label>
                            <pre className="mt-1 bg-gray-100 p-3 rounded text-sm font-mono whitespace-pre-wrap">
                              {table.shorthand_definition}
                            </pre>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Generated SQL:</Label>
                            <pre className="mt-1 bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
                              {table.generated_sql}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
