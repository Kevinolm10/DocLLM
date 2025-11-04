
import { documentService } from './documentService';

export interface SlashCommand {
    command: string;
    description: string;
    usage: string;
    handler: (args: string) => Promise<string>;
}

class SlashCommandService {
    private commands: Map<string, SlashCommand> = new Map();

    constructor() {
        this.registerDefaultCommands();
    }

    private registerDefaultCommands() {
        // Document management commands
        this.registerCommand({
            command: 'docs',
            description: 'List all documents',
            usage: '/docs',
            handler: async () => {
                const docs = await documentService.loadDocuments();
                if (docs.length === 0) {
                    return '📚 No documents found. Use the "Manage Docs" button to add some!';
                }

                const docList = docs.map(doc =>
                    `• **${doc.title}** (${doc.type}) - ${doc.tags.join(', ')}`
                ).join('\n');

                return `📚 **Available Documents (${docs.length})**:\n\n${docList}`;
            }
        });

        this.registerCommand({
            command: 'search',
            description: 'Search documents',
            usage: '/search <query>',
            handler: async (query: string) => {
                if (!query.trim()) {
                    return '❌ Please provide a search query. Usage: `/search <your query>`';
                }

                const results = await documentService.searchDocuments(query);
                if (results.length === 0) {
                    return `🔍 No documents found for "${query}"`;
                }

                const resultList = results.map(doc =>
                    `• **${doc.title}**: ${doc.content.substring(0, 100)}...`
                ).join('\n');

                return `🔍 **Search Results for "${query}" (${results.length})**:\n\n${resultList}`;
            }
        });

        this.registerCommand({
            command: 'help',
            description: 'Show available commands',
            usage: '/help',
            handler: async () => {
                const commandList = Array.from(this.commands.values())
                    .map(cmd => `• **${cmd.usage}** - ${cmd.description}`)
                    .join('\n');

                return `🚀 **Available Slash Commands**:\n\n${commandList}\n\n💡 Type any command to use it!`;
            }
        });

        this.registerCommand({
            command: 'clear',
            description: 'Clear chat history',
            usage: '/clear',
            handler: async () => {
                return '🧹 Chat cleared! (Note: Use the Clear Chat button for full functionality)';
            }
        });

        this.registerCommand({
            command: 'status',
            description: 'Show system status',
            usage: '/status',
            handler: async () => {
                const docs = await documentService.loadDocuments();
                return `📊 **System Status**:
• Documents: ${docs.length}
• Local Storage: ${localStorage.getItem('docllm_documents') ? 'Active' : 'Empty'}
• Last Updated: ${new Date().toLocaleString()}`;
            }
        });

        // Quick access commands
        this.registerCommand({
            command: 'upload',
            description: 'Show how to upload documents',
            usage: '/upload',
            handler: async () => {
                return `📤 **How to Upload Documents**:

1. Click the "📚 Manage Docs" button
2. Click "+ Add Document"
3. Fill in the form:
   - **Title**: Give your document a clear name
   - **Type**: Choose text, markdown, or JSON
   - **Content**: Paste or type your content
   - **Tags**: Add keywords for easier searching
4. Click "Save"

💡 **Pro tip**: Use descriptive titles and relevant tags to make documents easier to find!`;
            }
        });

        this.registerCommand({
            command: 'import',
            description: 'Import a file from your computer',
            usage: '/import',
            handler: async () => {
                try {
                    if (!window.electron?.importTextFile) {
                        return '❌ File import is only available in the desktop app. Use the "📚 Manage Docs" button to add documents manually.';
                    }

                    const importedDoc = await documentService.importFromFile();

                    if (importedDoc) {
                        return `✅ **File imported successfully!**

📄 **${importedDoc.title}**
📂 Type: ${importedDoc.type}
🏷️ Tags: ${importedDoc.tags.join(', ')}

The document is now available for search and AI queries!`;
                    } else {
                        return '❌ Import cancelled or no file selected.';
                    }
                } catch (error) {
                    return `❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
                }
            }
        });
    }

    registerCommand(command: SlashCommand) {
        this.commands.set(command.command, command);
    }

    isSlashCommand(message: string): boolean {
        return message.trim().startsWith('/');
    }

    async executeCommand(message: string): Promise<string> {
        const trimmed = message.trim();
        if (!trimmed.startsWith('/')) {
            throw new Error('Not a slash command');
        }

        const parts = trimmed.slice(1).split(' ');
        const commandName = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        const command = this.commands.get(commandName);
        if (!command) {
            const availableCommands = Array.from(this.commands.keys()).join(', ');
            return `❌ Unknown command: /${commandName}\n\nAvailable commands: ${availableCommands}\n\nType \`/help\` for more info.`;
        }

        try {
            return await command.handler(args);
        } catch (error) {
            console.error('Error executing command:', error);
            return `❌ Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }

    getCommands(): SlashCommand[] {
        return Array.from(this.commands.values());
    }

    getSuggestions(partial: string): string[] {
        if (!partial.startsWith('/')) return [];

        const commandPart = partial.slice(1).toLowerCase();
        return Array.from(this.commands.keys())
            .filter(cmd => cmd.startsWith(commandPart))
            .map(cmd => `/${cmd}`);
    }
}

export const slashCommandService = new SlashCommandService();