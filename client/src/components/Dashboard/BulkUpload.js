import React, { useState } from 'react';
import axios from 'axios';
import './BulkUpload.css';

const BulkUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('products', file);

    setUploading(true);
    setMessage('');

    try {
      const response = await axios.post('/api/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Error uploading file. Please try again.');
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bulk-upload-container">
      <h2>Bulk Product Upload</h2>
      <div className="upload-form">
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {message && <p className="upload-message">{message}</p>}
      <div className="instructions">
        <h3>CSV File Format</h3>
        <p>Please ensure your CSV file has the following columns in this exact order:</p>
        <code>product name,crossed price,cost price,selling price,status,img 1,img 2,img 3,img 4,img 5,img 6,quantity,choose of section</code>
      </div>
    </div>
  );
};

export default BulkUpload;
