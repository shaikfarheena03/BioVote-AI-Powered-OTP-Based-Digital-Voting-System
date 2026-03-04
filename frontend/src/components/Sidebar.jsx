function Sidebar({ setPage }) {
  return (
    <div style={{
      width: "220px",
      backgroundColor: "#1e293b",
      color: "white",
      height: "100vh",
      padding: "20px"
    }}>
      <h2>Admin Panel</h2>

      <button onClick={() => setPage("voters")} style={btnStyle}>
        Manage Voters
      </button>

      <button onClick={() => setPage("elections")} style={btnStyle}>
        Manage Elections
      </button>

      <button onClick={() => setPage("candidates")} style={btnStyle}>
        Manage Candidates
      </button>

      <button onClick={() => setPage("results")} style={btnStyle}>
        View Results
      </button>
    </div>
  );
}

const btnStyle = {
  display: "block",
  width: "100%",
  margin: "10px 0",
  padding: "10px",
  backgroundColor: "#334155",
  color: "white",
  border: "none",
  cursor: "pointer"
};

export default Sidebar;
