import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/LoginForm.css";
import Logo from '../assets/images/Educast-Logo.png';
import LoginImage from '../assets/images/Side-Img.jpg';
import { login } from "../api/authApi"; // ✅ Reuse login API
import { Eye, EyeSlash } from "react-bootstrap-icons"; // password toggle icons

const LoginForm = ({ setUserRole }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    setError("");

    try {
      const response = await login(username, password);

      const { token, role, name } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("name", name);
      setUserRole(role);

    } catch (err) {
      console.log(err);
      if (err.response) {
        // Show exact backend message
        setError(err.response.data);
      } else {
        setError("Network or server error");
      }
    }
  };

  return (
    <div className="container-fluid vh-100 login-theme">
      <div className="row h-100">

        {/* Left Image */}
        <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center p-3">
          <div className="position-relative image-container" style={{ height: "90vh" }}>
            <img
              src={LoginImage}
              alt="Login"
              className="img w-100 rounded-4 shadow"
              style={{ objectFit: "fill", height: "100%" }}
            />
          </div>
        </div>

        {/* Right Login Form */}
        <div className="col-md-6 d-flex flex-column align-items-center justify-content-center bg-white">
          <div className="mb-4">
            <img src={Logo} alt="Educast Logo" style={{ width: "100px" }} />
          </div>

          <div className="login-card p-4 shadow border col-10 col-sm-8 col-md-6 col-lg-5">
            <h2 className="text-center mb-1" style={{ color: "#f58a29", fontWeight: "700" }}>Educast</h2>
            <h5 className="text-center mb-4" style={{ color: "#000" }}>Dashboard Login</h5>

            <form onSubmit={handleSubmit}>

              {/* Username */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Username"
                  className="form-control custom-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              {/* Password with toggle */}
              <div className="mb-3 position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="form-control custom-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span
                  className="position-absolute top-50 end-0 translate-middle-y me-3"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? <EyeSlash /> : <Eye />}
                </span>
              </div>

              {/* Forget Password Link */}
              <div className="text-end mb-3">
                <a href="#" className="text-primary small text-decoration-none" onClick={(e) => e.preventDefault()}>
                  Forget Password?
                </a>
              </div>

              {/* Error Message */}
              {error && <p className="text-danger">{error}</p>}

              <button type="submit" className="btn btn-orange w-100 mb-3">
                Log In →
              </button>
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
