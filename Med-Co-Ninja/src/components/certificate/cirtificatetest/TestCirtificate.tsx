import React from 'react';
import './index.css';
import cirtificate from '../../../assets/techno.jpeg';

const Certificate = ({ 
  studentName = "Pooja Sawant", 
  regNo = "1524",
  duration = "3 month",
  courseName = "Post Graduate Diploma in Medical Coding", 
  grade = "A", 
  date = "15-Nov-2025" 
}) => {
  return (
    <div className="certificate-container">
      {/* 
        Ensure you have a blank version of the certificate saved in your 
        public folder or imported here. 
      */}
      <img 
        src={cirtificate}
        alt="Certificate Background" 
        className="certificate-bg"
      />

      <div className="certificate-content">
        {/* Student Name */}
        <h2 className="student-name">{studentName}</h2>

        {/* Dynamic Paragraph */}
        <p className="certificate-text">
          Reg no. <strong>{regNo}</strong> You have successfully completed our <strong>{duration}</strong> training program <br/>
          in <strong>{courseName}</strong> with <strong>{grade} Grade!</strong>
        </p>

        {/* Date */}
        <div className="certificate-date">
          <span className="date-value">{date}</span>
        </div>
      </div>
    </div>
  );
};

export default Certificate;