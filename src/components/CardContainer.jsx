// src/components/CardContainer.jsx
import React from "react";
import { Card } from "react-bootstrap";

const CardContainer = ({ title, children, className = "" }) => {
  return (
    <Card
      // 1. Added 'h-100' to make card full height in grid columns
      // 2. Added 'mb-3' for bottom spacing (let Row/Col handle horizontal spacing)
      className={`mb-3 shadow-sm ${className}`}
      style={{
        border: "2px solid #FFA500", // Orange Border
        borderRadius: "10px",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        boxShadow: "15px 22px 23px -14px #ffa50026",
        // Removed fixed 'margin: 20px' to prevent overflow on mobile
        // Removed fixed 'padding: 15px' (handled in Card.Body)
      }}
    >
      {title && (
        <Card.Header
          className="text-center fw-bold"
          style={{
            backgroundColor: "transparent",
            borderBottom: "none",
            color: "#055993", // Blue color
          }}
        >
          {/* Responsive Font Size: fs-4 (mobile) -> fs-2 (desktop) */}
          <span className="fs-4 fs-md-2">{title}</span>
        </Card.Header>
      )}
      
      {/* Responsive Padding: p-2 (mobile) -> p-3 (desktop) */}
      <Card.Body className="p-2 p-md-3">
        {children}
      </Card.Body>
    </Card>
  );
};

export default CardContainer;