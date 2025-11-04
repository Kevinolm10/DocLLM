export interface Document {
    id: string;
    title: string;
    content: string;
    type: 'markdown' | 'text' | 'json';
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface DocumentIndex {
    documents: Document[];
    lastUpdated: Date;
}

const MAX_DOCUMENTS = 1000;
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB per document
const MAX_TOTAL_STORAGE = 100 * 1024 * 1024; // 100MB total

class DocumentService {
    // Add proper typing for synonyms
    private readonly synonyms: Record<string, string[]> = {
        'upload': ['add', 'share', 'import', 'load', 'insert', 'submit'],
        'document': ['doc', 'file', 'text', 'content', 'paper'],
        'add': ['upload', 'create', 'insert', 'new', 'make'],
        'how': ['guide', 'tutorial', 'steps', 'instructions', 'way'],
        'delete': ['remove', 'erase', 'clear', 'destroy'],
        'edit': ['modify', 'change', 'update', 'alter'],
        'search': ['find', 'look', 'locate', 'query'],
    };

    private extractKeywords(query: string): string[] {
        // Remove common stop words and extract meaningful keywords
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'do', 'i', 'you', 'it', 'is', 'are', 'can', 'will', 'would'];

        const words = query.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word));
        return words;
    }

    private expandKeywords(keywords: string[]): string[] {
        const expanded = new Set(keywords);

        keywords.forEach(keyword => {
            // Add synonyms - use proper type checking
            const synonymList = this.synonyms[keyword];
            if (synonymList) {
                synonymList.forEach(synonym => expanded.add(synonym));
            }

            // Add partial matches - use proper type checking
            Object.entries(this.synonyms).forEach(([key, values]) => {
                if (values.includes(keyword)) {
                    expanded.add(key);
                }
            });
        });

        const result = Array.from(expanded);
        return result;
    }

    constructor() {
    }

    async loadDocuments(): Promise<Document[]> {
        try {
            // Try Electron first, fallback to localStorage
            if (window.electron?.loadDocuments) {
                const result = await window.electron.loadDocuments();
                return result.documents || [];
            } else {
                const stored = localStorage.getItem('docllm_documents');
                return stored ? JSON.parse(stored) : [];
            }
        } catch (error) {
            console.error('Error loading documents:', error);
            return [];
        }
    }

    async saveDocument(document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
        const documents = await this.loadDocuments();

        // Check limits
        if (documents.length >= MAX_DOCUMENTS) {
            throw new Error(`Maximum number of documents (${MAX_DOCUMENTS}) reached`);
        }

        if (document.content.length > MAX_DOCUMENT_SIZE) {
            throw new Error(`Document too large. Max size: ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB`);
        }

        // Validate and sanitize input
        const sanitizedDocument = {
            ...document,
            title: this.sanitizeString(document.title),
            content: this.sanitizeContent(document.content),
            tags: document.tags.map(tag => this.sanitizeString(tag))
        };

        const newDoc: Document = {
            ...sanitizedDocument,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        documents.push(newDoc);
        await this.saveDocuments(documents);
        return newDoc;
    }

    private sanitizeString(input: string): string {
        return input
            .replace(/[<>\"']/g, '') // Remove dangerous characters
            .trim()
            .substring(0, 200); // Limit length
    }

    private sanitizeContent(content: string): string {
        // Same sanitization as in main process
        return content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }

    async updateDocument(id: string, updates: Partial<Document>): Promise<Document | null> {
        const documents = await this.loadDocuments();
        const index = documents.findIndex(doc => doc.id === id);

        if (index === -1) return null;

        documents[index] = {
            ...documents[index],
            ...updates,
            updatedAt: new Date(),
        };

        await this.saveDocuments(documents);
        return documents[index];
    }

    async deleteDocument(id: string): Promise<boolean> {
        const documents = await this.loadDocuments();
        const filtered = documents.filter(doc => doc.id !== id);

        if (filtered.length === documents.length) return false;

        await this.saveDocuments(filtered);
        return true;
    }

    private async saveDocuments(documents: Document[]): Promise<void> {
        try {
            // Try Electron first, fallback to localStorage
            if (window.electron?.saveDocuments) {
                await window.electron.saveDocuments(documents);
            } else {
                localStorage.setItem('docllm_documents', JSON.stringify(documents));
            }
        } catch (error) {
            console.error('❌ Error saving documents:', error);
        }
    }

    async importFromFile(): Promise<Document | null> {
        try {
            if (!window.electron?.importTextFile) {
                throw new Error('File import not available in this environment');
            }

            const result = await window.electron.importTextFile();
            if (!result) return null;

            const { content, fileName } = result;

            // Determine file type from extension
            const extension = fileName.split('.').pop()?.toLowerCase();
            let type: Document['type'] = 'text';

            if (extension === 'md') type = 'markdown';
            else if (extension === 'json') type = 'json';

            // Auto-generate tags based on filename and content
            const autoTags = this.generateAutoTags(fileName, content);

            const document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'> = {
                title: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
                content,
                type,
                tags: autoTags,
            };

            return await this.saveDocument(document);
        } catch (error) {
            console.error('Error importing file:', error);
            throw error;
        }
    }

    private generateAutoTags(fileName: string, content: string): string[] {
        const tags: string[] = [];

        // Add tag based on file extension
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (extension) tags.push(extension);

        // Add tags based on common keywords in content
        const commonKeywords = ['guide', 'tutorial', 'documentation', 'readme', 'api', 'config', 'setup'];
        const lowerContent = content.toLowerCase();

        commonKeywords.forEach(keyword => {
            if (lowerContent.includes(keyword)) {
                tags.push(keyword);
            }
        });

        // Add tag based on filename patterns
        if (fileName.toLowerCase().includes('readme')) tags.push('readme');
        if (fileName.toLowerCase().includes('config')) tags.push('configuration');
        if (fileName.toLowerCase().includes('api')) tags.push('api');

        return [...new Set(tags)]; // Remove duplicates
    }

    async searchDocuments(query: string): Promise<Document[]> {
        const documents = await this.loadDocuments();

        // Extract and expand keywords
        const keywords = this.extractKeywords(query);
        const expandedKeywords = this.expandKeywords(keywords);

        const results = documents.filter(doc => {
            const docText = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();

            // Check if any expanded keyword is found in the document
            const keywordMatch = expandedKeywords.some(keyword =>
                docText.includes(keyword.toLowerCase())
            );

            // Also check for partial phrase matches
            const phraseMatch = keywords.length > 1 &&
                keywords.every(keyword => docText.includes(keyword.toLowerCase()));

            return keywordMatch || phraseMatch;
        });

        // Sort by relevance (documents with more keyword matches first)
        const sortedResults = results.sort((a, b) => {
            const aText = `${a.title} ${a.content} ${a.tags.join(' ')}`.toLowerCase();
            const bText = `${b.title} ${b.content} ${b.tags.join(' ')}`.toLowerCase();

            const aMatches = expandedKeywords.filter(keyword => aText.includes(keyword)).length;
            const bMatches = expandedKeywords.filter(keyword => bText.includes(keyword)).length;

            return bMatches - aMatches;
        });

        return sortedResults;
    }

    // Enhanced context creation with better prompts
    async createContext(query: string): Promise<string> {
        const relevantDocs = await this.searchDocuments(query);


        if (relevantDocs.length === 0) {
            return '';
        }

        const context = relevantDocs.map(doc =>
            `### ${doc.title}\n${doc.content}\n**Tags:** ${doc.tags.join(', ')}`
        ).join('\n\n---\n\n');

        const fullContext = `You are a helpful assistant with access to documentation. Use the following documentation to answer the user's question. Be specific and reference the documentation when possible.

AVAILABLE DOCUMENTATION:
${context}

USER QUESTION: ${query}

INSTRUCTIONS:
- Answer based on the documentation above
- If the documentation contains the answer, provide detailed steps
- If the documentation doesn't fully answer the question, say what information is available and what might be missing
- Be conversational and helpful`;

        return fullContext;
    }
}

export const documentService = new DocumentService();