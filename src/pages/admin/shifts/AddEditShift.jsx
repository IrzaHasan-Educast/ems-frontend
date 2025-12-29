// import React, { useEffect, useState } from "react";
// import { Form, Row, Col } from "react-bootstrap";
// import { useNavigate, useParams } from "react-router-dom";
// import { addShift, updateShift, getAllShifts } from "../../../api/shiftApi";
// import Sidebar from "../../../components/Sidebar";
// import TopNavbar from "../../../components/Navbar";
// import CardContainer from "../../../components/CardContainer";
// import AppButton from "../../../components/AppButton";

// const AddEditShift = ({ onLogout }) => {
//   const [shift, setShift] = useState({ shiftName: "", startsAt: "", endsAt: "" });
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const navigate = useNavigate();
//   const { id } = useParams(); // edit mode

//   useEffect(() => {
//     if (id) {
//       // fetch the shift by id to populate fields
//       getAllShifts().then((res) => {
//         const s = res.data.find((sh) => sh.id === parseInt(id));
//         if (s) setShift(s);
//       });
//     }
//   }, [id]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setShift((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (id) await updateShift(id, shift);
//     else await addShift(shift);
//     navigate("/admin/shifts");
//   };

//   return (
//     <div className="d-flex">
//       <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
//       <div className="flex-grow-1">
//         <TopNavbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
//             username={localStorage.getItem("name")}
//             role={localStorage.getItem("role")}/>
//         <div className="p-4 d-flex justify-content-center">
//           <div className="w-50">
//             <CardContainer title={id ? "Edit Shift" : "Add Shift"}>
//               <Form onSubmit={handleSubmit}>
//                 <Row className="mb-3">
//                   <Col>
//                     <Form.Group>
//                       <Form.Label>Shift Name</Form.Label>
//                       <Form.Control
//                         name="shiftName"
//                         value={shift.shiftName}
//                         onChange={handleChange}
//                         placeholder="Morning / Night"
//                         required
//                       />
//                     </Form.Group>
//                   </Col>
//                 </Row>

//                 <Row className="mb-3">
//                   <Col>
//                     <Form.Group>
//                       <Form.Label>Start Time</Form.Label>
//                       <Form.Control
//                         type="time"
//                         name="startsAt"
//                         value={shift.startsAt}
//                         onChange={handleChange}
//                         required
//                       />
//                     </Form.Group>
//                   </Col>
//                   <Col>
//                     <Form.Group>
//                       <Form.Label>End Time</Form.Label>
//                       <Form.Control
//                         type="time"
//                         name="endsAt"
//                         value={shift.endsAt}
//                         onChange={handleChange}
//                         required
//                       />
//                     </Form.Group>
//                   </Col>
//                 </Row>

//                 <div className="d-flex gap-2">
//                   <AppButton text={id ? "Update" : "Add"} type="submit" />
//                   <AppButton text="Cancel" variant="secondary" onClick={() => navigate("/admin/shifts")} />
//                 </div>
//               </Form>
//             </CardContainer>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddEditShift;
