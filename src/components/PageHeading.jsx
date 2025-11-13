// src/components/PageHeading.jsx
import React from "react";
import { Row, Col, Button } from "react-bootstrap";
import AppButton from "./AppButton";

const PageHeading = ({ title, buttonText, onButtonClick }) => {
  return (
    <Row
      className="align-items-center mb-4"
      style={{
        padding: "15px 20px",
        opacity: 0.95,
      }}
    >
      <Col>
        <h4 className="mb-0 fw-bold">{title}</h4>
      </Col>
      {buttonText && onButtonClick && (
        <Col className="text-end">
          <AppButton text={buttonText} variant="primary" onClick={onButtonClick} />
        </Col>
      )}
    </Row>
  );
};

export default PageHeading;
