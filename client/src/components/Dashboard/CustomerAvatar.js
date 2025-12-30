import React from 'react';
import gender from 'gender-detection';
import './CustomerAvatar.css';

const CustomerAvatar = ({ name }) => {
    const getAvatar = () => {
        const detectedGender = gender.detect(name.split(' ')[0]); // Use first name for detection
    switch (detectedGender) {
      case 'male':
        return <img src="https://www.w3schools.com/howto/img_avatar.png" alt="Male Avatar" className="avatar-image" />;
      case 'female':
        return <img src="https://www.w3schools.com/howto/img_avatar2.png" alt="Female Avatar" className="avatar-image" />;
      default:
        return <img src="https://www.w3schools.com/howto/img_avatar.png" alt="Default Avatar" className="avatar-image" />; // Fallback avatar
    }
  };

  return (
    <div className="customer-avatar">
      {getAvatar()}
    </div>
  );
};

export default CustomerAvatar;
