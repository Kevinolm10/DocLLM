import React from 'react';
import '../../styles/chatBoxContainer.css';

interface ContainerProps {
    children: React.ReactNode;
    className?: string;
}

const Container: React.FC<ContainerProps> = ({ children, className = '' }) => {
    return (
        <div className={`main-container ${className}`}>
            {children}
        </div>
    );
};

export default Container;