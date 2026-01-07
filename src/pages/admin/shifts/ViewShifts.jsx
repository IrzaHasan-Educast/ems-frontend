import React, { useEffect, useState } from "react";
import { Table, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import TopNavbar from "../../../components/Navbar";
import CardContainer from "../../../components/CardContainer";
import { getAllShifts, deleteShift } from "../../../api/shiftApi";
import PageHeading from "../../../components/PageHeading";

const ViewShifts = ({ onLogout }) => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const fetchShifts = async () => {
    try {
      const res = await getAllShifts();
      setShifts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this shift?")) return;
    await deleteShift(id);
    fetchShifts();
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            username={localStorage.getItem("name")}
            role={localStorage.getItem("role")}
        />
        <div className="p-4">
          <PageHeading
            title="All Shift"
            buttonText="Add shift"
            onButtonClick={() => navigate("/admin/shifts/add")}
          />
          <CardContainer>
            {loading ? (
              <div className="text-center mt-3">
                <Spinner animation="border" />
              </div>
            ) : (
              <Table striped bordered hover className="mt-3">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Managed By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((s, idx) => (
                    <tr key={s.id}>
                      <td>{idx + 1}</td>
                      <td>{s.shiftName}</td>
                      <td>{s.startsAt}</td>
                      <td>{s.endsAt}</td>
                      <td>{s.managerName}</td>
                      <td className="d-flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/admin/shifts/edit/${s.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(s.id)}
                        >
                          Delete
                        </Button>
                        {/* <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/admin/employee-shifts/assign`)}
                        >
                          Assign Employees
                        </Button> */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContainer>
        </div>
      </div>
    </div>
  );
};

export default ViewShifts;
