import React, { useRef, useEffect } from 'react';
import '../../styles/chatInput.css';

interface CustomInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    placeholder?: string;
    disabled?: boolean;
    maxLength?: number;
    autoFocus?: boolean;
}

const CustomInput: React.FC<CustomInputProps> = ({
    value,
    onChange,
    onSend,
    placeholder = "Type your message...",
    disabled = false,
    maxLength = 1000,
    autoFocus = true
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea based on content
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !disabled) {
                onSend();
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (newValue.length <= maxLength) {
            onChange(newValue);
        }
    };

    return (
        <div className={`input-container ${disabled ? 'disabled' : ''}`}>
            <div className="input-wrapper">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    className="message-input"
                    rows={1}
                />
                <div className="input-footer">
                    <div className="character-count">
                        {value.length}/{maxLength}
                    </div>
                    <div className="input-hint">
                        Press Enter to send, Shift+Enter for new line
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomInput;