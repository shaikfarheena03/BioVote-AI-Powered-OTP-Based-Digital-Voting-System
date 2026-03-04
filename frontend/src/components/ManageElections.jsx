import { useState, useEffect } from "react";

function ManageElections() {
  const [title, setTitle] = useState("");
  const [elections, setElections] = useState([]);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedElectionId, setSelectedElectionId] = useState(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endElectionId, setEndElectionId] = useState(null);

  // ================= FETCH ELECTIONS =================
  const fetchElections = async () => {
    const response = await fetch("http://127.0.0.1:5000/api/elections/");
    const data = await response.json();
    setElections(data);
  };

  useEffect(() => {
    fetchElections();
  }, []);

  // ================= AUTO HIDE MESSAGE =================
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // ================= ADD ELECTION =================
  const addElection = async () => {
    if (!title.trim()) {
      setMessage("Election title is required.");
      return;
    }

    const response = await fetch("http://127.0.0.1:5000/api/elections/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        is_active: false,
      }),
    });

    const data = await response.json();
    setMessage(data.message || data.error);
    setTitle("");
    fetchElections();
  };

  // ================= ACTIVATE ELECTION =================
  const activateElection = async (id) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/elections/${id}/activate`,
        { method: "PUT" }
      );

      const data = await response.json();
      setMessage(data.message || "Election activated successfully.");
      fetchElections();
    } catch (error) {
      console.error("Error activating election:", error);
    }
  };

  // ================= DELETE ELECTION =================
  const deleteElection = async (id) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/elections/${id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error);
        return;
      }

      setMessage("Election deleted successfully.");
      fetchElections();
    } catch (error) {
      console.error("Error deleting election:", error);
    }
  };
  // ================= END ELECTION =================

  const endElection = async (id) => {
  try {
    const response = await fetch(
      `http://127.0.0.1:5000/api/elections/${id}/end`,
      { method: "PUT" }
    );

    const data = await response.json();
    setMessage(data.message || "Election ended successfully.");
    fetchElections();
    } catch (error) {
    console.error("Error ending election:", error);
    }
  };

  return (
    <div className="w-full space-y-8">

      {/* ================= HEADING ================= */}
      <h2 className="text-2xl font-semibold text-gray-800">
        Manage Elections
      </h2>

      {/* ================= ADD ELECTION CARD ================= */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 space-y-4">

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Election Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 p-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={addElection}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
          >
            Add
          </button>
        </div>

        {message && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm text-center">
            {message}
          </div>
        )}
      </div>

      {/* ================= ELECTION LIST CARD ================= */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">

        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Registered Elections
        </h3>

        <div className="space-y-4">
          {elections.map((election) => (
            <div
              key={election.election_id}
              className="flex justify-between items-center px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl"
            >

              {/* LEFT SIDE */}
              <div>
                <p className="text-gray-800 font-semibold">
                  {election.title}
                </p>

                <div className="mt-2">
                  {election.is_active ? (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                      INACTIVE
                    </span>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="flex gap-3">

                {election.is_active ? (
                  <>
                  <button
                    onClick={() => {
                      setEndElectionId(election.election_id);
                      setShowEndModal(true);}}
                    className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition"
                  >
                     End
              </button>
              </>
                ) : (
                  <button
                    onClick={() =>
                      activateElection(election.election_id)
                    }
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
                  >
                    Activate
                  </button>
                )}

                {!election.is_active && (
                  <button
                    onClick={() => {
                      setSelectedElectionId(election.election_id);
                      setShowModal(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition"
                  >
                    Delete
                  </button>
                )}
                {showEndModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-96">

      <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
        End Election
      </h3>

      <p className="text-sm text-gray-600 mb-6 text-center">
        Are you sure you want to end this election?
      </p>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => {
            setShowEndModal(false);
            setEndElectionId(null);
          }}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
        >
          Cancel
        </button>

        <button
          onClick={async () => {
            await endElection(endElectionId);
            setShowEndModal(false);
            setEndElectionId(null);
          }}
          className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition"
        >
          End
        </button>
      </div>

    </div>
  </div>
)}
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* ================= DELETE MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-96">

            <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
              Confirm Deletion
            </h3>

            <p className="text-sm text-gray-600 mb-6 text-center">
              Are you sure you want to delete this election?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedElectionId(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  await deleteElection(selectedElectionId);
                  setShowModal(false);
                  setSelectedElectionId(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition"
              >
                Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default ManageElections;