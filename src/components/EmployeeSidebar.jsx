// import React, { useState } from "react"; 
// import { Nav } from "react-bootstrap"; 
// import { useNavigate, NavLink } from "react-router-dom"; 
// import Logo from "../assets/images/Educast-Logo.png"; 
// const EmployeeSidebar = ({ isOpen, onLogout }) => { 
//   const navigate = useNavigate(); 
//   const [leaveOpen, setLeaveOpen] = useState(false); 
//   const handleLogout = () => { 
//     localStorage.removeItem("token"); 
//     localStorage.removeItem("role"); localStorage.removeItem("username"); window.location.href = "/";
//    };

//   return (
//     <div
//       className={`sidebar d-flex flex-column justify-content-between p-3 ${
//         isOpen ? "sidebar-open" : "sidebar-closed"
//       }`}
//       style={{
//         backgroundColor: "#f58a29",
//         color: "white",
//         minHeight: "100vh",
//         position: "sticky",
//         top: 0,
//         alignSelf: "flex-start",
//       }}
//     >
//       {/* Logo Section */}
//       <div>
//         <div className="text-center">
//           <div className="bg-white border rounded-4 p-2">
//             <img src={Logo} alt="Educast" width={isOpen ? "100" : "40"} />
//           </div>
//           {isOpen && <h5 className="mt-2 fw-bold">Educast</h5>}
//         </div>

//         <Nav className="flex-column mt-4">
//           <NavLink
//             to="/employee/dashboard"
//             className="text-white mb-2"
//             style={{ textDecoration: "none" }}
//           >
//             <i className="bi bi-speedometer2 me-2"></i> {isOpen && "Dashboard"}
//           </NavLink>
//           <NavLink
//             to="/employee/work-history"
//             className="text-white mb-2"
//             style={{ textDecoration: "none" }}
//           >
//             <i className="bi bi-clock-history me-2"></i> {isOpen && "Work Sessions"}
//           </NavLink>

//           <NavLink to="/employee/attendance-history" className="text-white" style={{ textDecoration: "none" }}>
//             <i className="bi bi-calendar-check me-2"></i> {isOpen && "Attendance History"}
//           </NavLink>

//                     {/* Leave Dropdown */}
//           <div className="mt-3">
//             <Nav.Link
//               className="text-white"
//               onClick={() => setLeaveOpen(!leaveOpen)}
//               style={{ textDecoration: "none" }}
//             >
//               <i className="bi bi-calendar2-plus me-2"></i>
//               {isOpen && "Leave"}
//               {isOpen && (
//                 <i
//                   className={`bi ms-2 ${
//                     leaveOpen ? "bi-chevron-up" : "bi-chevron-down"
//                   }`}
//                 ></i>
//               )}
//             </Nav.Link>

//             {leaveOpen && isOpen && (
//               <div className="ms-4 mt-2">
//                 <NavLink
//                   to="/employee/leave-history"
//                   className="text-white d-block mb-1"
//                   style={{ textDecoration: "none" }}
//                 >
//                    Leave History
//                 </NavLink>

//                 <NavLink
//                   to="/employee/leave/apply"
//                   className="text-white d-block mb-1"
//                   style={{ textDecoration: "none" }}
//                 >
//                    Apply Leave
//                 </NavLink>
//               </div>
//             )}
//           </div>
//         </Nav>
//       </div>

//       {/* Logout Button */}
//       <div>
//         <button
//           className="btn btn-link text-white text-start w-100 p-0"
//           onClick={handleLogout}
//           style={{ textDecoration: "none" }}
//         >
//           <i className="bi bi-box-arrow-right me-2"></i> {isOpen && "Logout"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default EmployeeSidebar;
