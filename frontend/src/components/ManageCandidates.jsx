import { useState, useEffect } from "react";

function ManageCandidates() {
  const [name, setName] = useState("");
  const [electionId, setElectionId] = useState("");
  const [elections, setElections] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filterElection, setFilterElection] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState(null);

  // Fetch elections
  const fetchElections = async () => {
    const res = await fetch("http://127.0.0.1:5000/api/elections/");
    const data = await res.json();
    setElections(data);
  };

  // Fetch candidates
  const fetchCandidates = async () => {
    const res = await fetch("http://127.0.0.1:5000/api/candidates/");
    const data = await res.json();
    setCandidates(data);
  };

  useEffect(() => {
    fetchElections();
    fetchCandidates();
  }, []);
  // Auto-hide message after 3 seconds
useEffect(() => {
  if (message) {
    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }
}, [message]);


  const addCandidate = async () => {
    if (!name || !electionId) {
      setMessage("Select election and enter candidate name");
      return;
    }

    const response = await fetch("http://127.0.0.1:5000/api/candidates/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: name,
        election_id: electionId
      })
    });

    const data = await response.json();

    if (response.ok) {
      setMessage(data.message);
      setName("");
      fetchCandidates();
    } else {
      setMessage(data.error);
    }
  };
  const filteredCandidates = candidates.filter((c) => {
  const matchesElection =
    !filterElection || c.election_id === Number(filterElection);

  const matchesSearch =
    c.name.toLowerCase().includes(search.toLowerCase());

  return matchesElection && matchesSearch;
});

  const deleteCandidate = async (id) => {
    const response = await fetch(
      `http://127.0.0.1:5000/api/candidates/${id}`,
      {
        method: "DELETE"
      }
    );

    const data = await response.json();

    if (response.ok) {
      setMessage(data.message);
      fetchCandidates();
    } else {
      setMessage(data.error);
    }
  };

 return (
  <>
  <div className="space-y-8">
  <div className="
      w-full max-w-4xl
      bg-white/5
      backdrop-blur-xl
      border border-white/10
      shadow-2xl
      rounded-2xl
      p-10
  ">


      {/* Heading */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">

        Manage Candidates
      </h2>

      {/* Add Candidate Section */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm p-6">

  <div className="flex flex-col md:flex-row gap-4">

    <select
      value={electionId}
      onChange={(e) => setElectionId(e.target.value)}
      className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select Election</option>
      {elections.map((e) => (
        <option key={e.election_id} value={e.election_id}>
          {e.title}
        </option>
      ))}
    </select>

    <input
      type="text"
      placeholder="Candidate Name"
      value={name}
      onChange={(e) => setName(e.target.value)}
      className="flex-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
    />

    <button
      onClick={addCandidate}
      className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
    >
      Add
    </button>

  </div>
</div>

<div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm p-6">

  <div className="flex flex-col md:flex-row gap-4">

    <select
      value={filterElection}
      onChange={(e) => setFilterElection(e.target.value)}
      className="p-3 rounded-lg border border-gray-300"
    >
      <option value="">All Elections</option>
      {elections.map((e) => (
        <option key={e.election_id} value={e.election_id}>
          {e.title}
        </option>
      ))}
    </select>

    <input
      type="text"
      placeholder="Search by candidate name..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="flex-1 p-3 rounded-lg border border-gray-300"
    />

  </div>
</div>

      {/* Message */}
      {message && (
        <div className="mb-6 p-3 rounded bg-blue-50 border border-blue-200 text-blue-700 text-sm">
          {message}
        </div>
      )}

      {/* Candidate List */}
        <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm p-6">

  <h3 className="text-lg font-semibold text-gray-700 mb-4">
    Registered Candidates
  </h3>

  <div className="space-y-4">

    {filteredCandidates.map((c) => (
      <div
        key={c.candidate_id}
        className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:shadow-sm transition"
      >
        <div>
          <p className="font-medium text-gray-800">{c.name}</p>
          <p className="text-sm text-gray-500">
            {c.election_title}
          </p>
        </div>

        <button
          onClick={() => {
            setDeleteCandidateId(c.candidate_id);
            setShowDeleteModal(true);
          }}
          className="px-4 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
        >
          Delete
        </button>
      </div>
    ))}


  </div>
</div>


    </div>
        {showDeleteModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-96">

      <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
        Delete Candidate
      </h3>

      <p className="text-sm text-gray-600 mb-6 text-center">
        Are you sure you want to delete this Candidate?
      </p>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => {
            setShowDeleteModal(false);
            setDeleteCandidateId(null);
          }}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
        >
          Cancel
        </button>

        <button
          onClick={async () => {
            await deleteCandidate(deleteCandidateId);
            setShowDeleteModal(false);
            setDeleteCandidateId(null);
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
  </>
);

}

export default ManageCandidates;
