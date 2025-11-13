// src/components/CardContainer.jsx
import React from "react";
import { Card } from "react-bootstrap";

const CardContainer = ({ title, children }) => {
  return (
    <Card
      style={{
        border: "2px solid #FFA500", // aapka orange secondary
        borderRadius: "25px",
        backgroundColor: "rgba(255, 255, 255, 0.95)", // thodi opacity
        padding: "15px",
        marginBottom: "20px",
        boxShadow: "15px 22px 23px -14px #ffa50026"

      }}
    >
      {title && (
        <Card.Header
          style={{
            backgroundColor: "transparent",
            borderBottom: "none",
            textAlign: "center",
            fontWeight: "bold",
            color: " #055993", // aapka blue color heading ke liye
            fontSize: "2rem",
          }}
        >
          {title}
        </Card.Header>
      )}
      <Card.Body>{children}</Card.Body>
    </Card>
  );
};

export default CardContainer;
