// src/components/PageHeading.jsx
import React from "react";
import { Row, Col } from "react-bootstrap";
import AppButton from "./AppButton";

const PageHeading = ({ 
  title, 
  buttonText, 
  onButtonClick, 
  showUnderline = true 
}) => {
  return (
    <Row
      className="align-items-center mb-4"
      style={{ padding: "10px 15px", opacity: 0.95 }}
    >
      <Col>
        <h3
          className="mb-1 fw-bold"
          style={{ color: "#055993" }} // theme primary color
        >
          {title}
        </h3>
        {showUnderline && (
          <div
            style={{
              height: "3px",
              width: "60px",
              backgroundColor: "#f58a29", // theme accent color
              borderRadius: "2px",
              marginTop: "4px",
            }}
          />
        )}
      </Col>
      {buttonText && onButtonClick && (
        <Col className="text-end">
          <AppButton
            text={buttonText}
            variant="primary"
            onClick={onButtonClick}
          />
        </Col>
      )}
    </Row>
  );
};

export default PageHeading;
