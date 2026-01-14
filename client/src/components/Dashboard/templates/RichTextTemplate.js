import React from 'react';
import './RichTextTemplate.css';

const RichTextTemplate = ({ content }) => {
    // If content is a JSON string, parse it. Otherwise use it directly.
    let config = content;
    if (typeof content === 'string') {
        try {
            config = JSON.parse(content);
        } catch (e) {
            // If parsing fails, it might be just the html string or legacy info
            config = { html: content };
        }
    }

    // Default content if nothing exists
    const htmlContent = config?.html || '<div style="text-align: center; padding: 40px; color: #666;"><h2>Start writing your rich text here...</h2><p>Click on the edit button to add content.</p></div>';

    // Extract padding, margin and background settings
    const paddingTop = config?.paddingTop !== undefined ? config.paddingTop : 20;
    const paddingBottom = config?.paddingBottom !== undefined ? config.paddingBottom : 20;
    const marginTop = config?.marginTop !== undefined ? config.marginTop : 0;
    const marginBottom = config?.marginBottom !== undefined ? config.marginBottom : 0;
    const useThemeBg = config?.useThemeBg !== undefined ? config.useThemeBg : true;
    const bgColor = config?.bgColor || 'transparent';

    // Build section style
    const sectionStyle = {
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        backgroundColor: useThemeBg ? 'transparent' : bgColor,
    };

    const processVideoLinks = (html) => {
        if (!html) return '';

        // Helper to extract YouTube ID
        const getYouTubeId = (url) => {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        };

        // Replace anchor tags pointing to YouTube with iframes
        // This handles cases where users paste a link and it becomes a clickable link
        let processed = html.replace(
            /<a\s+(?:[^>]*?\s+)?href="(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^"]+)"[^>]*>.*?<\/a>/gi,
            (match, url) => {
                const videoId = getYouTubeId(url);
                if (videoId) {
                    return `<div class="video-container"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
                }
                return match;
            }
        );

        return processed;
    };

    return (
        <section className="rich-text-section" style={sectionStyle}>
            <div className="rich-text-container ql-snow">
                <div className="ql-editor" dangerouslySetInnerHTML={{ __html: processVideoLinks(htmlContent) }} />
            </div>
        </section>
    );
};

export default RichTextTemplate;
