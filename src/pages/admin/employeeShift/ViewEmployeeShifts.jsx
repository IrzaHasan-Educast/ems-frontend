import React, { useEffect, useState } from "react";
import { Table, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import TopNavbar from "../../../components/Navbar";
import CardContainer from "../../../components/CardContainer";
import AppButton from "../../../components/AppButton";
import {
  getAllEmployeeShifts,
  deleteEmployeeShift,
} from "../../../api/employeeShiftApi";

const ViewEmployeeShifts = ({ onLogout }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchData = async () => {
    const res = await getAllEmployeeShifts();
    setData(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this assignment?")) return;
    await deleteEmployeeShift(id);
    fetchData();
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          username={localStorage.getItem("name")}
          role={localStorage.getItem("role")}
        />

        <div className="p-4">
          <CardContainer title="Employee Shift Assignments">
            <AppButton
              text="Assign New Shift"
              onClick={() => navigate("/admin/employee-shifts/assign")}
            />

            {loading ? (
              <Spinner />
            ) : (
              <Table bordered hover className="mt-3">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Shift</th>
                    <th>Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((es, idx) => (
                    <tr key={es.id}>
                      <td>{idx + 1}</td>
                      <td>{es.empName}</td>
                      <td>{es.shiftName}</td>
                      <td>
                        {es.startsAt} - {es.endsAt}
                      </td>
                      <td className="d-flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate(`/admin/employee-shifts/edit/${es.id}`)
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(es.id)}
                        >
                          Delete
                        </Button>
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

export default ViewEmployeeShifts;
