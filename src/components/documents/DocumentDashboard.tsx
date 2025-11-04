import React, { useState, useEffect } from 'react';
import { documentService } from '../../services/documentService';
import type { Document } from '../../services/documentService';
import '../../styles/DocumentDashboard.css';

interface DocumentDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

const DocumentDashboard: React.FC<DocumentDashboardProps> = ({ isOpen, onClose }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingDoc, setEditingDoc] = useState<Document | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        const docs = await documentService.loadDocuments();
        setDocuments(docs);
    };

    const handleFileUpload = async () => {
        try {
            setIsUploading(true);
            const importedDoc = await documentService.importFromFile();

            if (importedDoc) {
                await loadDocuments();
            }
        } catch (error) {
            console.error('❌ Error importing file:', error);
            // You could show an error message here
        } finally {
            setIsUploading(false);
        }
    };

    const filteredDocuments = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!isOpen) return null;

    return (
        <div className="document-dashboard-overlay">
            <div className="document-dashboard">
                <div className="dashboard-header">
                    <h2>📚 Document Management</h2>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>

                <div className="dashboard-toolbar">
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <div className="toolbar-buttons">
                        <button
                            onClick={handleFileUpload}
                            disabled={isUploading || !window.electron?.importTextFile}
                            className="upload-btn"
                        >
                            {isUploading ? '⏳ Uploading...' : '📁 Import File'}
                        </button>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="add-doc-btn"
                        >
                            + Add Document
                        </button>
                    </div>
                </div>

                <div className="documents-list">
                    {filteredDocuments.map(doc => (
                        <DocumentCard
                            key={doc.id}
                            document={doc}
                            onEdit={setEditingDoc}
                            onDelete={async (id) => {
                                await documentService.deleteDocument(id);
                                loadDocuments();
                            }}
                        />
                    ))}
                </div>

                {isCreating && (
                    <DocumentEditor
                        onSave={async (doc) => {
                            await documentService.saveDocument(doc);
                            loadDocuments();
                            setIsCreating(false);
                        }}
                        onCancel={() => setIsCreating(false)}
                    />
                )}

                {editingDoc && (
                    <DocumentEditor
                        document={editingDoc}
                        onSave={async (doc) => {
                            await documentService.updateDocument(editingDoc.id, doc);
                            loadDocuments();
                            setEditingDoc(null);
                        }}
                        onCancel={() => setEditingDoc(null)}
                    />
                )}
            </div>
        </div>
    );
};

const DocumentCard: React.FC<{
    document: Document;
    onEdit: (doc: Document) => void;
    onDelete: (id: string) => void;
}> = ({ document, onEdit, onDelete }) => (
    <div className="document-card">
        <div className="doc-header">
            <h3>{document.title}</h3>
            <div className="doc-actions">
                <button onClick={() => onEdit(document)}>✏️</button>
                <button onClick={() => onDelete(document.id)}>🗑️</button>
            </div>
        </div>
        <p className="doc-preview">{document.content.substring(0, 100)}...</p>
        <div className="doc-tags">
            {document.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
            ))}
        </div>
    </div>
);

const DocumentEditor: React.FC<{
    document?: Document;
    onSave: (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onCancel: () => void;
}> = ({ document, onSave, onCancel }) => {
    const [title, setTitle] = useState(document?.title || '');
    const [content, setContent] = useState(document?.content || '');
    const [tags, setTags] = useState(document?.tags.join(', ') || '');
    const [type, setType] = useState<Document['type']>(document?.type || 'text');

    const handleSave = () => {
        if (!title.trim() || !content.trim()) return;

        onSave({
            title: title.trim(),
            content: content.trim(),
            type,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        });
    };

    return (
        <div className="document-editor-modal">
            <div className="editor-content">
                <h3>{document ? 'Edit Document' : 'Create Document'}</h3>

                <input
                    type="text"
                    placeholder="Document title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="title-input"
                />

                <select value={type} onChange={(e) => setType(e.target.value as Document['type'])}>
                    <option value="text">Text</option>
                    <option value="markdown">Markdown</option>
                    <option value="json">JSON</option>
                </select>

                <textarea
                    placeholder="Document content..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="content-textarea"
                    rows={15}
                />

                <input
                    type="text"
                    placeholder="Tags (comma separated)..."
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="tags-input"
                />

                <div className="editor-actions">
                    <button onClick={handleSave} className="save-btn">Save</button>
                    <button onClick={onCancel} className="cancel-btn">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default DocumentDashboard;