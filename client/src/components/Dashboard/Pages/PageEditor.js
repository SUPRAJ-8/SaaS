import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import './PageEditor.css';

const PageEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isNew = !id;
    const [websiteId, setWebsiteId] = useState(location.state?.websiteId || null);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        metaDescription: '',
        status: 'draft'
    });

    useEffect(() => {
        const init = async () => {
            let currentWebsiteId = websiteId;

            // If we don't have websiteId (e.g. refresh or direct link), try to fetch default
            if (!currentWebsiteId) {
                try {
                    const res = await axios.get('http://localhost:5001/api/clients/first');
                    if (res.data && res.data.website) {
                        currentWebsiteId = res.data.website._id;
                        setWebsiteId(currentWebsiteId);
                    }
                } catch (err) {
                    console.error("Error fetching website ID", err);
                }
            }

            if (!isNew && currentWebsiteId) {
                try {
                    // Fetch all pages to find the one we want. 
                    // ideally we should have a single page endpoint like /api/websites/:id/pages/:pageId
                    // but our current backend uses /api/pages/:websiteId which returns all pages. 
                    // This is inefficient but works for now as per current API structure.
                    // Wait, looking at routes/websites.js, it serves public content.
                    // routes/pages.js has router.get('/:websiteId') -> returns all pages.
                    // It DOES NOT have a get single page by ID endpoint for editing! 
                    // Wait, let me check routes/pages.js again.

                    const res = await axios.get(`http://localhost:5001/api/pages/${currentWebsiteId}`);
                    const page = res.data.find(p => p._id === id);
                    if (page) {
                        setFormData({
                            title: page.title,
                            slug: page.slug,
                            content: page.content,
                            metaDescription: page.metaDescription || '',
                            status: page.status || 'draft'
                        });
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        };
        init();
    }, [isNew, id, websiteId]);

    const { title, slug, content, metaDescription, status } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        if (!websiteId) {
            alert("Cannot save: No Website ID found. (Dev note: Create a website first)");
            return;
        }

        try {
            const config = { headers: { 'Content-Type': 'application/json' } };
            const body = JSON.stringify(formData);

            if (isNew) {
                await axios.post(`http://localhost:5001/api/pages/${websiteId}`, body, config);
            } else {
                await axios.put(`http://localhost:5001/api/pages/${websiteId}/${id}`, body, config);
            }
            navigate('/pages');
        } catch (err) {
            console.error('Error saving page', err);
            alert('Error saving page');
        }
    };

    return (
        <div className="page-editor">
            <h2>{isNew ? 'Create Page' : 'Edit Page'}</h2>
            {!websiteId && <div className="warning">Loading Website Context... (If this persists, no website exists)</div>}

            <form onSubmit={onSubmit}>
                {/* Form fields same as before... */}
                <div className="form-group">
                    <label>Title</label>
                    <input type="text" name="title" value={title} onChange={onChange} required />
                </div>
                <div className="form-group">
                    <label>Slug</label>
                    <input type="text" name="slug" value={slug} onChange={onChange} required />
                </div>
                <div className="form-group">
                    <label>Content</label>
                    <textarea name="content" value={content} onChange={onChange} rows="10" required></textarea>
                </div>
                <div className="form-group">
                    <label>Meta Description</label>
                    <textarea name="metaDescription" value={metaDescription} onChange={onChange}></textarea>
                </div>
                <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={status} onChange={onChange}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                </div>
                <button type="submit" className="btn-primary" disabled={!websiteId}>Save</button>
            </form>
        </div>
    );
};

export default PageEditor;
