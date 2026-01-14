import React, { useState, useEffect } from "react";
import ManagerSidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import CardContainer from "../../components/CardContainer";
import PageHeading from "../../components/PageHeading";
import { Table, Badge, Spinner, Form, InputGroup } from "react-bootstrap";
import * as workSessionApi from "../../api/workSessionApi";
import {
  formatTimeAMPM,
  formatPakistanDateLabel,
  parseApiDate,
  getNowUTC,
} from "../../utils/time";

const TeamWorkSessions = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const formatDuration = (hoursDecimal) => {
    const totalMinutes = Math.round(hoursDecimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const res = await workSessionApi.getManagerWorkSessionHistory();
        const sorted = (res.data || []).sort(
          (a, b) => parseApiDate(b.clockInTime) - parseApiDate(a.clockInTime)
        );
        setSessions(sorted);
        setFilteredSessions(sorted);
      } catch (err) {
        console.error("Error fetching team sessions:", err);
      }
      setLoading(false);
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    let filtered = sessions;

    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter) {
      filtered = filtered.filter((s) =>
        s.clockInTime?.startsWith(dateFilter)
      );
    }

    setFilteredSessions(filtered);
  }, [searchTerm, dateFilter, sessions]);

  return (
    <div className="d-flex">
      <ManagerSidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className="flex-grow-1">
        <Navbar
          toggleSidebar={toggleSidebar}
          username={localStorage.getItem("name")}
          role={localStorage.getItem("role") || "Manager"}
        />

        <div className="container-fluid p-3">
          <PageHeading title="Team Work Sessions" />

          <CardContainer>
            {/* Filters */}
            <div className="row mb-3">
              <div className="col-md-6 mb-2">
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search by employee name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </div>
              <div className="col-md-6 mb-2">
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-calendar"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </InputGroup>
              </div>
            </div>

            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading sessions...</p>
              </div>
            ) : filteredSessions.length > 0 ? (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>Total Hours</th>
                      <th>Break Hours</th>
                      <th>Working Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session, idx) => {
                      const clockIn = parseApiDate(session.clockInTime);
                      const clockOut = parseApiDate(session.clockOutTime);

                      const totalBreakMillis =
                        session.breaks?.reduce((sum, b) => {
                          const start = parseApiDate(b.startTime);
                          const end = parseApiDate(b.endTime) || getNowUTC();
                          if (!start) return sum;
                          return sum + (end.getTime() - start.getTime());
                        }, 0) || 0;

                      const totalMillis =
                        (clockOut || getNowUTC()).getTime() -
                        (clockIn?.getTime() || 0);
                      const netMillis = totalMillis - totalBreakMillis;

                      const isActive = !session.clockOutTime;
                      const isOnBreak = session.breaks?.some((b) => !b.endTime);

                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <strong>{session.employeeName || "Unknown"}</strong>
                          </td>
                          <td>{formatPakistanDateLabel(session.clockInTime)}</td>
                          <td>{formatTimeAMPM(session.clockInTime)}</td>
                          <td>
                            {session.clockOutTime
                              ? formatTimeAMPM(session.clockOutTime)
                              : "--"}
                          </td>
                          <td>{formatDuration(totalMillis / 1000 / 3600)}</td>
                          <td>{formatDuration(totalBreakMillis / 1000 / 3600)}</td>
                          <td>{formatDuration(netMillis / 1000 / 3600)}</td>
                          <td>
                            {isActive ? (
                              isOnBreak ? (
                                <Badge bg="warning">On Break</Badge>
                              ) : (
                                <Badge bg="info">Working</Badge>
                              )
                            ) : (
                              <Badge bg="success">Completed</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted">No sessions found</p>
            )}
          </CardContainer>
        </div>
      </div>
    </div>
  );
};

export default TeamWorkSessions;