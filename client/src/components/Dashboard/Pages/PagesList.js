import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const PagesList = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    // TODO: dynamic website ID. For now we might need to fetch it or context.
    // This is a placeholder. Real app would get this from auth/context.
    const [websiteId, setWebsiteId] = useState(null);

    useEffect(() => {
        const fetchWebsiteId = async () => {
            try {
                // Fetch the first website available
                const res = await axios.get('http://localhost:5001/api/clients/first');
                if (res.data && res.data.website) {
                    setWebsiteId(res.data.website._id);
                }
            } catch (err) {
                console.error("Error fetching website ID", err);
            }
        };
        fetchWebsiteId();
    }, []);

    useEffect(() => {
        if (!websiteId) return;

        const fetchPages = async () => {
            try {
                const res = await axios.get(`http://localhost:5001/api/pages/${websiteId}`);
                setPages(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchPages();
    }, [websiteId]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="pages-list">
            <div className="header">
                <h2>Pages</h2>
                <Link to="/pages/new" state={{ websiteId }} className="btn-primary">Add New</Link>
            </div>

            {/* Warning regarding missing Website ID logic for MVP */}
            {!websiteId && <p className="warning">No Website ID found. Please implement context.</p>}

            <table className="table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Slug</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {pages.map(page => (
                        <tr key={page._id}>
                            <td>{page.title}</td>
                            <td>{page.slug}</td>
                            <td className={`status ${page.status}`}>{page.status}</td>
                            <td>
                                <Link to={`/pages/${page._id}`} state={{ websiteId }}>Edit</Link>
                            </td>
                        </tr>
                    ))}
                    {pages.length === 0 && <tr><td colSpan="4">No pages found.</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

export default PagesList;
