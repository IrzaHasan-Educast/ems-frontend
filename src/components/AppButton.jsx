// 📁 src/components/AppButton.jsx
import React from "react";
import { Button } from "react-bootstrap";

const AppButton = ({ text, onClick, type = "button", variant = "primary", size = "md" }) => {
  // Custom styles for primary (orange) button
  const style = variant === "primary"
    ? {
        backgroundColor: "#f58a29",
        color: "#fff",
        border: "none"
      }
    : {}; // default bootstrap styling for other variants

  return (
    <Button type={type} onClick={onClick} size={size} style={style} variant={variant}>
      {text}
    </Button>
  );
};

export default AppButton;
