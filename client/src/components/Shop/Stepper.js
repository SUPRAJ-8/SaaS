import React from 'react';
import './Stepper.css';

const Stepper = ({ currentStep }) => {
  const steps = ['Personal Details', 'Payment', 'Complete'];

  return (
    <div className="stepper-container">
      {steps.map((step, index) => {
        const isCompleted = index + 1 < currentStep;
        const isActive = index + 1 === currentStep;

        return (
          <React.Fragment key={index}>
            <div className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
              <div className="step-circle">{index + 1}</div>
              <div className="step-label">{step}</div>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-connector ${isCompleted ? 'completed' : ''}`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Stepper;
