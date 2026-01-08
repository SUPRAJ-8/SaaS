import React, { useState, useRef, useCallback } from 'react';
import { FaImage, FaPalette, FaFont, FaAlignLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import DebouncedColorPicker from './DebouncedColorPicker';

const DynamicSectionEditor = ({ schema, content, onChange }) => {
    const debounceTimers = useRef({});

    // Helper to update a single field
    const updateField = (key, value) => {
        onChange({
            ...content,
            [key]: value
        });
    };

    // Debounced update for color picker (prevents infinite loop on drag)
    const updateFieldDebounced = useCallback((key, value, delay = 100) => {
        // Clear previous timer for this field
        if (debounceTimers.current[key]) {
            clearTimeout(debounceTimers.current[key]);
        }

        // Set new timer
        debounceTimers.current[key] = setTimeout(() => {
            updateField(key, value);
        }, delay);
    }, [content, onChange]);

    if (!schema || !Array.isArray(schema)) {
        return <div className="p-4 text-gray-500">No editable fields defined for this template.</div>;
    }

    return (
        <div className="dynamic-editor-container">
            {schema.map((field) => {
                // Group Header
                if (field.type === 'header') {
                    return (
                        <div key={field.key || field.label} className="property-group-header">
                            <h4>{field.label}</h4>
                        </div>
                    );
                }

                return (
                    <div key={field.key} className="property-group animate-fade">
                        {/* Label & Type Icon */}
                        <div className="property-label-row">
                            <label>
                                {field.label}
                            </label>
                            {field.type === 'image' && <FaImage className="field-icon-hint" />}
                            {field.type === 'color' && <FaPalette className="field-icon-hint" />}
                            {field.type === 'text' && <FaFont className="field-icon-hint" />}
                        </div>

                        {/* INPUT: Text / Textarea */}
                        {(field.type === 'text' || field.type === 'string') && (
                            <input
                                type="text"
                                value={content[field.key] || ''}
                                onChange={(e) => updateField(field.key, e.target.value)}
                                placeholder={field.placeholder || ''}
                                className="dynamic-input"
                            />
                        )}

                        {/* INPUT: Long Text */}
                        {field.type === 'textarea' && (
                            <textarea
                                rows={field.rows || 3}
                                value={content[field.key] || ''}
                                onChange={(e) => updateField(field.key, e.target.value)}
                                placeholder={field.placeholder || ''}
                                className="dynamic-textarea"
                            />
                        )}

                        {/* INPUT: Color (DEBOUNCED to prevent infinite loop) */}
                        {field.type === 'color' && (
                            <DebouncedColorPicker
                                value={content[field.key] || '#ffffff'}
                                onChange={(val) => updateField(field.key, val)}
                            />
                        )}

                        {/* INPUT: Boolean (Checkbox / Toggle) */}
                        {field.type === 'boolean' && (
                            <div
                                className={`checkbox-standard ${content[field.key] ? 'checked' : ''}`}
                                onClick={() => updateField(field.key, !content[field.key])}
                            >
                                <div className="checkbox-icon">
                                    {content[field.key] ? <FaEye /> : <FaEyeSlash />}
                                </div>
                                <span>{field.label}</span>
                            </div>
                        )}

                        {/* INPUT: Image URL */}
                        {field.type === 'image' && (
                            <div className="image-input-wrapper">
                                <input
                                    type="text"
                                    value={content[field.key] || ''}
                                    onChange={(e) => updateField(field.key, e.target.value)}
                                    placeholder="https://..."
                                    className="dynamic-input"
                                />
                                {content[field.key] && (
                                    <img src={content[field.key]} alt="Preview" className="field-image-preview" />
                                )}
                            </div>
                        )}

                        {/* INPUT: Select / Dropdown */}
                        {field.type === 'select' && (
                            <select
                                value={content[field.key] || field.options?.[0]?.value || ''}
                                onChange={(e) => updateField(field.key, e.target.value)}
                                className="dynamic-select"
                            >
                                {field.options && field.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default DynamicSectionEditor;
