import React from 'react';
import '../../styles/sendButton.css';

interface SendButtonProps {
    onPress: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    message?: string;
}

const SendButton: React.FC<SendButtonProps> = ({
    onPress,
    disabled = false,
    isLoading = false,
    message = ''
}) => {

    const isDisabled = disabled || isLoading || message.trim() === '';

    const renderIcon = () => {
        if (isLoading) {
            return (
                <div className="loading-dot">
                    <span className="loading-text">●●●</span>
                </div>
            );
        }

        return (
            <span className={`send-icon ${isDisabled ? 'disabled-icon' : ''}`}>
                ➤
            </span>
        );
    };

    return (
        <button
            onClick={onPress}
            className={`send-button ${isDisabled ? 'disabled' : ''} ${isLoading ? 'loading' : ''}`}
            disabled={isDisabled}
        >
            <div className="button-content">
                {renderIcon()}
                <span className={`button-text ${isDisabled ? 'disabled-text' : ''}`}>
                    {isLoading ? 'Sending...' : 'Send'}
                </span>
            </div>
        </button>
    );
};

export default SendButton;