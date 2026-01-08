import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes } from 'react-icons/fa';

const DebouncedColorPicker = ({ value, onChange, onClear, className = '', style = {} }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        if (localValue === value) return;
        const timer = setTimeout(() => {
            onChange(localValue);
        }, 50);
        return () => clearTimeout(timer);
    }, [localValue, onChange, value]);

    const colorInputValue = useMemo(() => {
        if (localValue && localValue !== 'transparent' && /^#[0-9A-F]{6}$/i.test(localValue)) {
            return localValue;
        }
        return '#ffffff';
    }, [localValue]);

    return (
        <div className={`custom-color-pill ${className}`} style={style}>
            <div className="color-indicator" style={{
                background: localValue || 'transparent',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <input
                    type="color"
                    value={colorInputValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    style={{
                        position: 'absolute',
                        top: '-50%',
                        left: '-50%',
                        width: '200%',
                        height: '200%',
                        opacity: 0,
                        cursor: 'pointer',
                        padding: 0,
                        margin: 0
                    }}
                />
            </div>
            <input
                type="text"
                value={localValue === 'transparent' ? '' : (localValue || '')}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder="transparent"
            />
            {onClear && (
                <FaTimes
                    className="clear-color-btn"
                    onClick={onClear}
                />
            )}
        </div>
    );
};

export default DebouncedColorPicker;
