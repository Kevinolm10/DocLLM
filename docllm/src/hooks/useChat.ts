import { useState, useCallback } from 'react';
import { ollamaService } from '../services/ollamaApi';
import { slashCommandService } from '../services/slashCommands';

export interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai' | 'system'; // Add 'system' for slash commands
    timestamp: Date;
}

export const useChat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentModel, setCurrentModel] = useState('llama3.2:1b');
    const [isConnected, setIsConnected] = useState(false);

    const checkConnection = useCallback(async () => {
        try {
            const connected = await ollamaService.checkConnection();
            setIsConnected(connected);
            return connected;
        } catch (error) {
            console.error('Connection check failed:', error);
            setIsConnected(false);
            return false;
        }
    }, []);

    const sendMessage = useCallback(async (content: string) => {
        if (isLoading || !content.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            content: content.trim(),
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            let responseContent: string;
            let responseType: 'ai' | 'system' = 'ai';

            // Check if it's a slash command
            if (slashCommandService.isSlashCommand(content)) {
                responseContent = await slashCommandService.executeCommand(content);
                responseType = 'system';
            } else {
                // Regular AI response
                responseContent = await ollamaService.generateResponse(content, currentModel);
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: responseContent,
                sender: responseType,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: slashCommandService.isSlashCommand(content) 
                    ? `❌ Command error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    : 'Sorry, I encountered an error. Please make sure Ollama is running and try again.',
                sender: 'system',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [currentModel, isLoading]);

    const clearChat = useCallback(() => {
        setMessages([]);
    }, []);

    return {
        messages,
        isLoading,
        currentModel,
        isConnected,
        setCurrentModel,
        sendMessage,
        clearChat,
        checkConnection,
    };
};