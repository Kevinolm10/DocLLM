import React, { useState, useEffect } from 'react';
import Container from '../container/Container';
import CustomInput from '../input/CustomInput';
import SendButton from '../buttons/SendButton';
import DocumentDashboard from '../documents/DocumentDashboard';
import { useChat } from '../../hooks/useChat';
import '../../styles/chatInterface.css';

const ChatInterface: React.FC = () => {
    const [message, setMessage] = useState('');
    const [availableModels] = useState<string[]>([]);
    const [showDocuments, setShowDocuments] = useState(false);
    const {
        messages,
        isLoading,
        currentModel,
        isConnected,
        setCurrentModel,
        sendMessage,
        clearChat,
        checkConnection
    } = useChat();

    // Check Ollama connection on component mount
    useEffect(() => {
        checkConnection();
    }, [checkConnection]);

    const handleSendMessage = async () => {
        if (!message.trim() || isLoading) return;

        await sendMessage(message);
        setMessage('');
    };

    const renderMessage = (msg: typeof messages[0]) => (
        <div key={msg.id} className={`message ${msg.sender}-message`}>
            <div className="message-content">
                <p>{msg.content}</p>
                <span className="timestamp">
                    {msg.timestamp.toLocaleTimeString()}
                </span>
            </div>
        </div>
    );

    return (
        <Container className="chat-interface">
            <div className="chat-header">
                <h1>DocLLM Assistant</h1>
                <div className="header-controls">
                    <div className="connection-status">
                        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
                        <span>{isConnected ? `Connected` : 'Disconnected from Ollama'}</span>
                        <button onClick={checkConnection} className="refresh-btn">🔄</button>
                    </div>

                    <button
                        onClick={() => setShowDocuments(true)}
                        className="docs-btn"
                    >
                        📚 Manage Docs
                    </button>
                </div>

                {/* Model Selector */}
                {isConnected && availableModels.length > 0 && (
                    <div className="model-selector">
                        <label htmlFor="model-select">Model: </label>
                        <select
                            id="model-select"
                            value={currentModel}
                            onChange={(e) => setCurrentModel(e.target.value)}
                            className="model-dropdown"
                        >
                            {availableModels.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="empty-state">
                        <h3>Welcome to DocLLM!</h3>
                        <p>Start a conversation with your local AI assistant.</p>
                        {!isConnected && (
                            <div className="connection-help">
                                <p>⚠️ Make sure Ollama is running:</p>
                                <code>ollama serve</code>
                            </div>
                        )}
                    </div>
                ) : (
                    messages.map(renderMessage)
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
                        placeholder={isConnected ? "Ask me anything..." : "Connect to Ollama first..."}
                        disabled={isLoading || !isConnected}
                        maxLength={1000}
                    />
                    <SendButton
                        onPress={handleSendMessage}
                        disabled={!isConnected}
                        isLoading={isLoading}
                        message={message}
                    />
                </div>
                {messages.length > 0 && (
                    <button onClick={clearChat} className="clear-chat-btn">
                        Clear Chat
                    </button>
                )}
            </div>

            <DocumentDashboard
                isOpen={showDocuments}
                onClose={() => setShowDocuments(false)}
            />
        </Container>
    );
};

export default ChatInterface;