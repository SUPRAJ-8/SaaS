import React from 'react';

/**
 * DynamicSection Component
 * Renders a section based on a JSON structure and content data.
 * 
 * Props:
 * - structure: The JSON tree defining the DOM elements (nodes).
 * - content: The actual data values (title, images, etc.) to inject.
 * - styles: Optional CSS string to inject into a <style> tag scoped to this section.
 */

const DynamicSection = ({ structure, content = {}, styles = '' }) => {

    // Helper: Resolve placeholders like "{{title}}" to "My Title"
    const resolveContent = (text) => {
        if (typeof text !== 'string') return text;
        return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
            return content[key.trim()] || '';
        });
    };

    // Helper: Recursively render nodes
    const renderNode = (node, index) => {
        if (!node) return null;

        // 1. Check Condition (e.g., "show_button": false)
        if (node.condition) {
            const conditionKey = node.condition.replace('!', '');
            const isNegated = node.condition.startsWith('!');
            const value = content[conditionKey];

            if (isNegated && value) return null;
            if (!isNegated && !value) return null;
        }

        // 2. Resolve Properties (src, href, style, className)
        const props = { key: index };

        // ClassName
        if (node.className) props.className = node.className;

        // Inline Styles (converting JSON style object values)
        if (node.style) {
            props.style = {};
            Object.keys(node.style).forEach(key => {
                props.style[key] = resolveContent(node.style[key]);
            });
        }

        // HTML Attributes (src, href, etc.)
        if (node.props) {
            Object.keys(node.props).forEach(key => {
                props.style = props.style || {};
                // Special handling for background images in style
                if (key === 'src' || key === 'href' || key === 'alt') {
                    props[key] = resolveContent(node.props[key]);
                } else {
                    props[key] = node.props[key];
                }
            });
        }

        // 3. Render Children (Text or Arrays)
        let children = null;
        if (node.text) {
            children = resolveContent(node.text);
        } else if (node.children && Array.isArray(node.children)) {
            children = node.children.map((child, i) => renderNode(child, i));
        }

        // 4. Create Element
        // Default to div if no tag specified
        const Tag = node.tag || 'div';

        // Safety: Prevent script tags
        if (Tag === 'script') return null;

        return React.createElement(Tag, props, children);
    };

    if (!structure) return <div className="p-4 text-red-500">Error: Missing Template Structure</div>;

    const uniqueStyleId = `style-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="dynamic-section-wrapper">
            {/* Inject Scoped Styles if provided */}
            {styles && (
                <style>
                    {styles}
                </style>
            )}

            {/* Start Rendering Recursively */}
            {renderNode(structure, 0)}
        </div>
    );
};

export default DynamicSection;
