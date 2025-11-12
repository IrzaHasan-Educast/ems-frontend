import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/LoginForm.css"; // Custom CSS
import Logo from '../assets/images/Educast-Logo.png';
import LoginImage from '../assets/images/Side-Img.jpg';

const LoginForm = ({ setUserRole }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:8080/api/v1/auth/login", {
        username,
        password,
      });

      const { token, role } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      setUserRole(role);

    } catch (err) {
      console.log(err);
      setError("Invalid username or password");
    }
  };

  return (
    <div className="container-fluid vh-100 login-theme">
      <div className="row h-100">
        {/* Left Image */}
        <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center p-3">
  <div className="position-relative image-container" style={{ height: "90vh" }}> {/* height adjust ki */}
    <img
      src={LoginImage}
      alt="Login"
      className="img w-100 rounded-4 shadow"
      style={{ objectFit: "fill", height: "100%"}} // img height parent ke hisab se
    />
  </div>
</div>



        {/* Right Login Form */}
        <div className="col-md-6 d-flex flex-column align-items-center justify-content-center bg-white">
          {/* Logo above the form */}
          <div className="mb-4">
            <img src={Logo} alt="Educast Logo" style={{ width: "100px" }} />
          </div>

          {/* Login Form Box */}
            <div className=" login-card p-4 shadow border  col-10 col-sm-8 col-md-6 col-lg-5" style={{ maxWidth: "auto" , borderWidth: "3px" }}>
            {/* Heading */}
            <h2 className="text-center mb-1" style={{ color: "#f58a29", fontWeight: "700" }}>Educast</h2>
            <h5 className="text-center mb-4" style={{ color: "#000" }}>Dashboard Login</h5>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Email Address"
                  className="form-control custom-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <input
                  type="password"
                  placeholder="Password"
                  className="form-control custom-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="text-end mb-3">
                <a href="#" className="text-primary small text-decoration-none">
                  Forget Password?
                </a>
              </div>

              {error && <p className="text-danger">{error}</p>}

              <button type="submit" className="btn btn-orange w-100 mb-3">
                Log In →
              </button>
{/* 
              <button type="button" className="btn btn-outline-orange w-100 mb-3">
                <i className="bi bi-google me-2"></i> Sign in with Google
              </button> */}
            </form>
          </div>
          {/* Footer */}
            <p className="mt-3 text-center text-muted">
              &copy; 2025, <span style={{ color: "blue" }}>Educast Global EMS</span> - All rights reserved
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
