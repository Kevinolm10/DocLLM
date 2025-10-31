import React, { useState } from 'react';
import Container from '../container/Container';
import CustomInput from '../input/CustomInput';
import SendButton from '../buttons/SendButton';
import '../../styles/chatInterface.css';

interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

const ChatInterface: React.FC = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async () => {
        if (!message.trim() || isLoading) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            content: message,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setMessage('');
        setIsLoading(true);

        try {
            // TODO: Replace with your actual AI API call
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

            // Add AI response
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: "This is a simulated AI response. Replace this with your actual LLM integration.",
                sender: 'ai',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            // Handle error - maybe add an error message
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container className="chat-interface">
            <div className="chat-header">
                <h1>DocLLM Assistant</h1>
                <p>Ask me anything about your documents!</p>
            </div>

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="empty-state">
                        <h3>👋 Welcome!</h3>
                        <p>Start a conversation by typing a message below.</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className={`message ${msg.sender}-message`}>
                            <div className="message-content">
                                <p>{msg.content}</p>
                                <span className="timestamp">
                                    {msg.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="message ai-message">
                        <div className="message-content typing">
                            <p>AI is thinking...</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="input-section">
                <div className="input-row">
                    <CustomInput
                        value={message}
                        onChange={setMessage}
                        onSend={handleSendMessage}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        maxLength={1000}
                    />
                    <SendButton
                        onPress={handleSendMessage}
                        disabled={false}
                        isLoading={isLoading}
                        message={message}
                    />
                </div>
            </div>
        </Container>
    );
};

export default ChatInterface;