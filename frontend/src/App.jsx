import { useState ,useEffect} from "react";
import ManageVoters from "./components/ManageVoters";
import ManageElections from "./components/ManageElections";
import ManageCandidates from "./components/ManageCandidates";
import ManageResults from "./components/ManageResults";
import VoterPortal from "./components/VoterPortal";

function App() {
  const [role, setRole] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminStats, setAdminStats] = useState(null);

  useEffect(() => {
  const savedRole = localStorage.getItem("role");
  const savedAdminAuth = localStorage.getItem("adminAuth");

  if (savedRole) {
    setRole(savedRole);
  }

  if (savedAdminAuth === "true") {
    setAdminAuthenticated(true);
  }
 }, []);

  
  const handleAdminLogin = async () => {
  setAdminError("");

  try {
    const response = await fetch("http://127.0.0.1:5000/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: adminUsername,
        password: adminPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setAdminError(data.error || "Login failed");
      return;
    }

    // Login successful
    console.log("Login successful, saving adminAuth");
    setAdminAuthenticated(true);
    localStorage.setItem("adminAuth", "true");
    console.log("Saved value:", localStorage.getItem("adminAuth"));
    } catch (error) {
    setAdminError("Server error. Please try again.");
    }
  };

  const handleLogout = () => {
  localStorage.removeItem("role");
  localStorage.removeItem("adminAuth");

  setAdminAuthenticated(false);
  setRole(null);

  setAdminUsername("");
  setAdminPassword("");
  setAdminError("");
  };

  // ADMIN STATS
useEffect(() => {
  if (role === "admin" && adminAuthenticated) {
    fetch("http://127.0.0.1:5000/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setAdminStats(data);
      })
      .catch((err) => {
        console.error("Failed to fetch admin stats:", err);
      });
  }
}, [role, adminAuthenticated]);
  /* ================================
     ROLE SELECTION SCREEN
  ================================= */
if (!role) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-16 px-6">
      
      {/* Center Card */}
      <div className="relative w-full max-w-2xl bg-white shadow-md rounded-2xl px-16 py-20 text-center overflow-hidden">
        
        {/* Watermark */}
        <img
          src="/SPMVV_LOGO.png"  
          alt="University Seal"
          className="absolute inset-0 m-auto w-[380px] opacity-[0.035] pointer-events-none select-none"
        />

        {/* Content */}
        <p className="text-sm tracking-widest text-blue-800 mb-4">
          Sri Padmavati Mahila University
        </p>

        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          Online Voting System
        </h1>

        <p className="text-gray-500 mb-12">
          Secure Election Platform with Face Authentication & OTP Verification
        </p>

        <div className="flex justify-center gap-6">

          <button
            onClick={() => {setRole("admin")
              localStorage.setItem("role", "admin");
            }}
            className="bg-blue-700 hover:bg-blue-800 text-white px-10 py-3 rounded-md transition duration-200"
          >
            Admin Login
          </button>

          <button
            onClick={() => {setRole("voter")
              localStorage.setItem("role", "voter");
            }}
            className="bg-blue-700 hover:bg-blue-800 text-white px-10 py-3 rounded-md transition duration-200"
          >
            Voter Portal
          </button>

        </div>
      </div>
    </div>
  );
}
console.log("Admin Stats State:", adminStats);
/* ================================
     ADMIN PANEL
================================= */
if (role === "admin") {
  if (role === "admin" && !adminAuthenticated) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="relative w-full max-w-md bg-white shadow-md rounded-2xl px-10 py-14 text-center overflow-hidden">

        {/* Watermark */}
        <img
          src="/SPMVV_LOGO.png"
          alt="University Seal"
          className="absolute inset-0 m-auto h-[60%] opacity-[0.04] object-contain pointer-events-none select-none"
        />

        <p className="text-xs tracking-widest text-gray-600">
          SPMVV
        </p>

        <p className="text-[11px] text-gray-500 mb-4">
          University Election Portal
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Admin Login
        </h2>

        <div className="space-y-4 relative z-10">
          <input
            type="text"
            placeholder="Username"
            value={adminUsername}
            onChange={(e) => setAdminUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <input
            type="password"
            placeholder="Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          {adminError && (
            <p className="text-red-600 text-sm">{adminError}</p>
          )}

          <button
            onClick={handleAdminLogin}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-md transition"
          >
            Login
          </button>

          <button
            onClick={() => setRole(null)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Back
          </button>
        </div>

      </div>
    </div>


  );
}
if (role === "admin" && adminAuthenticated) {

  return (
        <div className="flex min-h-screen bg-gray-100 text-gray-800">

      {/* Sidebar */}
      <div
        className={`bg-blue-900 text-white transition-all duration-300 ${
          sidebarOpen ? "w-64 p-6" : "w-16 p-3"
        }`}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mb-8 text-xl hover:text-gray-300 transition"
        >
          ☰
        </button>

        {sidebarOpen && (
          <>
            <div className="mb-6">
      <p className="text-xs tracking-widest text-white/70">
        SPMVV
      </p>

      <p className="text-[11px] text-white/60 mb-2">
        University Election Portal
      </p>

      <h2 className="text-lg font-semibold text-white">
        Admin Panel
      </h2>
    </div>

            <div className="space-y-2">

              <button
                onClick={() => setPage("voters")}
                className={`w-full text-left px-4 py-2 rounded-md transition ${
                  page === "voters"
                    ? "bg-blue-700 text-white"
                    : "hover:bg-blue-800"
                }`}
              >
                Manage Voters
              </button>

              <button
                onClick={() => setPage("elections")}
                className={`w-full text-left px-4 py-2 rounded-md transition ${
                  page === "elections"
                    ? "bg-blue-700 text-white"
                    : "hover:bg-blue-800"
                }`}
              >
                Manage Elections
              </button>

              <button
                onClick={() => setPage("candidates")}
                className={`w-full text-left px-4 py-2 rounded-md transition ${
                  page === "candidates"
                    ? "bg-blue-700 text-white"
                    : "hover:bg-blue-800"
                }`}
              >
                Manage Candidates
              </button>

              <button
                onClick={() => setPage("results")}
                className={`w-full text-left px-4 py-2 rounded-md transition ${
                  page === "results"
                    ? "bg-blue-700 text-white"
                    : "hover:bg-blue-800"
                }`}
              >
                View Results
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 mt-6 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
                >
                Logout
              </button>

            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center pt-16 px-6">

        <h1 className="text-3xl font-bold text-gray-800 mb-14 text-center">
          University Election Administration
        </h1>

        <div className="w-full max-w-5xl min-h-[450px] overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 
                shadow-2xl rounded-2xl p-12 transition-all duration-300">

          {/* Watermark */}
          <img
            src="/SPMVV_LOGO.png"
            alt="University Seal"
            className="absolute inset-0 m-auto h-[70%] max-h-[320px] opacity-[0.04] object-contain pointer-events-none select-none"
          />

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Election Overview
            </h2>
          <div className="h-[2px] w-12 bg-blue-600 mt-2 rounded"></div>
          </div>

        {adminStats && (
  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

    {/* Total Voters */}
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
      <p className="text-sm text-gray-500 uppercase tracking-wide">
        Total Voters
      </p>
      <h3 className="text-3xl font-bold text-gray-800 mt-3">
        {adminStats.total_voters}
      </h3>
    </div>

    {/* Active Election (Highlighted) */}
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
      <p className="text-sm text-blue-600 uppercase tracking-wide">
        Active Election
      </p>
      <h3 className="text-lg font-semibold text-gray-800 mt-3">
        {adminStats.active_election}
      </h3>
    </div>

    {/* Total Candidates */}
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
      <p className="text-sm text-gray-500 uppercase tracking-wide">
        Total Candidates
      </p>
      <h3 className="text-3xl font-bold text-gray-800 mt-3">
        {adminStats.total_candidates}
      </h3>
    </div>

    {/* Total Votes */}
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition">
      <p className="text-sm text-gray-500 uppercase tracking-wide">
        Total Votes Cast
      </p>
      <h3 className="text-3xl font-bold text-gray-800 mt-3">
        {adminStats.total_votes}
      </h3>
    </div>

  </div>
)}

          {page === "voters" && <ManageVoters />}
          {page === "elections" && <ManageElections />}
          {page === "candidates" && <ManageCandidates />}
          {page === "results" && <ManageResults />}

        </div>
      </div>
    </div>
  );
}
}
if (role === "voter") {
  return (
    <div className="min-h-screen bg-gray-50 relative">

      {/* Top Bar */}
      <div className="flex justify-between items-center px-10 py-6">
        <div>
          <p className="text-xs tracking-widest text-gray-600">
            SPMVV
          </p>
          <p className="text-sm text-gray-800 font-medium">
            University Election Portal
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Logout
        </button>
      </div>

      {/* CENTER CONTENT */}
      <div className="flex items-center justify-center min-h-[70vh] px-6">
        <VoterPortal />
      </div>

    </div>
  );
}

}

export default App;