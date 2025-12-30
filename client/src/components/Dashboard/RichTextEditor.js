import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './RichTextEditor.css';

const Quill = ReactQuill.Quill;

// Register Undo and Redo icons
var icons = Quill.import('ui/icons');
icons['undo'] = `<svg viewbox="0 0 18 18">
    <polygon class="ql-fill ql-stroke" points="6 10 4 12 2 10 6 10"></polygon>
    <path class="ql-stroke" d="M8.09,13.91A4.6,4.6,0,0,0,9,14,5,5,0,1,0,4,9"></path>
  </svg>`;
icons['redo'] = `<svg viewbox="0 0 18 18">
    <polygon class="ql-fill ql-stroke" points="12 10 14 12 16 10 12 10"></polygon>
    <path class="ql-stroke" d="M9.91,13.91A4.6,4.6,0,0,1,9,14a5,5,0,1,1,5-5"></path>
  </svg>`;

const modules = {
    toolbar: {
        container: [
            ['undo', 'redo'],
            ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
            [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
            [{ 'header': 1 }, { 'header': 2 }, { 'header': 3 }, { 'header': 4 }, { 'header': 5 }, { 'header': 6 }],
            ['link', 'image', 'video'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
            [{ 'align': [] }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']                                         // remove formatting button
        ],
        handlers: {
            'undo': function () {
                this.quill.history.undo();
            },
            'redo': function () {
                this.quill.history.redo();
            }
        }
    },
    history: {
        delay: 500,
        maxStack: 100,
        userOnly: true
    },
    clipboard: {
        matchVisual: false,
    }
};

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'script',
    'link', 'image', 'video',
    'blockquote', 'code-block',
    'list', 'bullet', 'check',
    'align', 'indent',
    'color', 'background'
];

const RichTextEditor = ({ value, onChange, placeholder, style }) => {
    const handleChange = (content, delta, source, editor) => {
        // Source 'user' means the change was triggered by user input
        // However, some normalizations also happen under 'user' source or no source.
        // A more robust check is to compare values and avoid updates for empty boilerplates.

        const isActuallyEmpty = content === '<p><br></p>' || content === '';
        const wasActuallyEmpty = value === '<p><br></p>' || value === '' || !value;

        if (content !== value) {
            // If both are "empty" representations, don't trigger change
            if (isActuallyEmpty && wasActuallyEmpty) return;

            onChange(content);
        }
    };

    return (
        <div className="rich-text-editor-wrapper" style={style}>
            <ReactQuill
                theme="snow"
                value={value || ''}
                onChange={handleChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder || 'Write something amazing...'}
            />
        </div>
    );
};

export default RichTextEditor;
