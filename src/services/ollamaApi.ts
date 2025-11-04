import { documentService } from './documentService';

interface OllamaRequest {
    model: string;
    prompt: string;
    stream?: boolean;
}

interface OllamaResponse {
    response: string;
    done: boolean;
    context?: number[];
}

class OllamaService {
    private baseUrl: string;
    private defaultModel: string;

    constructor(baseUrl = 'http://localhost:11434', defaultModel = 'llama3.2:1b') {
        this.baseUrl = baseUrl;
        this.defaultModel = defaultModel;
    }

    async generateResponse(prompt: string, model?: string, useContext = true): Promise<string> {
        try {
            let enhancedPrompt = prompt;

            if (useContext) {
                const context = await documentService.createContext(prompt);
                if (context) {
                    enhancedPrompt = `${context}\n\nUser question: ${prompt}`;
                }
            }

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model || this.defaultModel,
                    prompt: enhancedPrompt,
                    stream: false,
                } as OllamaRequest),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const data: OllamaResponse = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error calling Ollama API:', error);
            throw new Error('Failed to get response from Ollama');
        }
    }

    async listModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.status}`);
            }

            const data = await response.json();
            return data.models?.map((model: any) => model.name) || [];
        } catch (error) {
            console.error('Error fetching models:', error);
            return [];
        }
    }

    async checkConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch (error) {
            console.error('Ollama connection failed:', error);
            return false;
        }
    }
}

export const ollamaService = new OllamaService();
export default OllamaService;