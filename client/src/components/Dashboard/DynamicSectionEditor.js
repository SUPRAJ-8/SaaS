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
                // 1. Dependency Logic: Hide field if it depends on another field's value
                if (field.dependsOn) {
                    const dependsOnField = field.dependsOn.field;
                    const expectedValue = field.dependsOn.value;
                    const currentValue = content[dependsOnField];

                    // Special case for boolean/toggle: if value is true, check truthiness
                    if (expectedValue === true && !currentValue) return null;
                    if (expectedValue === false && currentValue) return null;
                    // General case
                    if (expectedValue !== true && expectedValue !== false && currentValue !== expectedValue) {
                        return null;
                    }
                }

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

                        {/* INPUT: Boolean / Toggle */}
                        {(field.type === 'boolean' || field.type === 'toggle') && (
                            <div className="toggle-wrapper" onClick={() => updateField(field.key, !content[field.key])}>
                                <div className={`saas-toggle ${content[field.key] ? 'on' : 'off'}`}>
                                    <div className="toggle-handle"></div>
                                </div>
                                <span className="toggle-label-text">{content[field.key] ? 'Enabled' : 'Disabled'}</span>
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
                                value={content[field.key] || (typeof field.options?.[0] === 'object' ? field.options[0].value : field.options?.[0]) || ''}
                                onChange={(e) => updateField(field.key, e.target.value)}
                                className="dynamic-select"
                            >
                                {field.options && field.options.map(opt => {
                                    const value = typeof opt === 'string' ? opt : opt.value;
                                    const label = typeof opt === 'string' ? opt.charAt(0).toUpperCase() + opt.slice(1) : opt.label;
                                    return (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default DynamicSectionEditor;
