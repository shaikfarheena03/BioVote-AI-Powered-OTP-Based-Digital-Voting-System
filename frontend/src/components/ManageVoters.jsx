import { useState, useEffect, useRef } from "react";

function ManageVoters() {
  const [voterId, setVoterId] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [voters, setVoters] = useState([]);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingVoter, setEditingVoter] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteVoterId, setDeleteVoterId] = useState(null);

  const videoRef = useRef(null);

  useEffect(() => {
    fetchVoters();
  }, []);

  const fetchVoters = async () => {
    const res = await fetch("http://127.0.0.1:5000/api/voters/");
    const data = await res.json();
    setVoters(data);
  };

  // ================= CAMERA =================
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  // ================= ADD / UPDATE =================
  const captureAndRegister = async () => {
    if (!voterId || !name || !mobile) {
      setMessage("All fields are required.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg");
    const base64Image = imageData.split(",")[1];

    const url = editingVoter
      ? `http://127.0.0.1:5000/api/voters/${editingVoter}`
      : "http://127.0.0.1:5000/api/voters/";

    const method = editingVoter ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voter_id: voterId,
        name,
        mobile,
        face_image: base64Image,
      }),
    });

    const data = await res.json();
    setMessage(data.message || data.error);

    resetForm();
    fetchVoters();
  };

  const resetForm = () => {
    setVoterId("");
    setName("");
    setMobile("");
    setEditingVoter(null);
  };

  // ================= EDIT =================
  const handleEdit = (voter) => {
    
    setEditingVoter(voter.voter_id);
    setVoterId(voter.voter_id);
    setName(voter.name);
    setMobile(voter.mobile);
    
  };

  // ================= DELETE =================
  const deleteVoter = async (id) => {
    await fetch(`http://127.0.0.1:5000/api/voters/${id}`, {
      method: "DELETE",
    });
    fetchVoters();
  };

  // ================= SEARCH FILTER =================
  const filteredVoters = voters.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.voter_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-8">

      {/* Heading */}
      <h2 className="text-2xl font-semibold text-gray-800 border-b-2 border-blue-500 inline-block pb-1">
        Manage Voters
      </h2>

      {/* Form Card */}
      <div className="bg-white border border-gray-200 shadow-sm0 p-8 rounded-2xl space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Voter ID"
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
            className="
p-3 rounded-lg
bg-white
border border-gray-300
text-gray-900
placeholder-gray-400
focus:outline-none
focus:ring-2 focus:ring-blue-500
"          />

          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="
p-3 rounded-lg
bg-white
border border-gray-300
text-gray-900
placeholder-gray-400
focus:outline-none
focus:ring-2 focus:ring-blue-500
"
          />

          <input
            type="text"
            placeholder="Mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="
p-3 rounded-lg
bg-white
border border-gray-300
text-gray-900
placeholder-gray-400
focus:outline-none
focus:ring-2 focus:ring-blue-500
"
/>
        </div>

        {/* Camera */}
        <div className="flex flex-col items-center space-y-4">
          <video
            ref={videoRef}
            autoPlay
            className="rounded-xl border border-white/10 w-72"
          />

          <div className="flex gap-4">
            <button
              onClick={startCamera}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              Start Camera
            </button>

            <button
              onClick={captureAndRegister}
              className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
            >
              {editingVoter ? "Update Voter" : "Capture & Register"}
            </button>

            {editingVoter && (
              <button
                onClick={resetForm}
                className="px-6 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="text-blue-400 text-center">
            {message}
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-800">
        Registered Voters
      </h3>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by Name or Voter ID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="
w-full p-3 rounded-lg
bg-white
border border-gray-300
text-gray-900
placeholder-gray-400
focus:outline-none
focus:ring-2 focus:ring-blue-500
"
/>

      {/* Voter List */}
      <div className="space-y-4">
        {filteredVoters.map((v) => (
          <div
            key={v.voter_id}
            className="flex justify-between items-center bg-white border border-gray-200 shadow-sm p-4 rounded-xl"
          >
            <div className="space-y-1">
              <p className="text-gray-900 font-semibold">{v.name}</p>
              <p className="text-gray-600 text-sm">
                ID: {v.voter_id}
              </p>
              <p className="text-gray-600 text-sm">
                Mobile: {v.mobile}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleEdit(v)}
                className="px-4 py-1 rounded-lg bg-yellow-500 hover:bg-yellow-600 transition text-black"
              >
                Edit
              </button>

              <button
                onClick={() => {
                  setDeleteVoterId(v.voter_id);
                  setShowDeleteModal(true);
                }}
                className="px-4 py-1 rounded-lg bg-red-600 hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {showDeleteModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-96">

      <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
        Delete Voter
      </h3>

      <p className="text-sm text-gray-600 mb-6 text-center">
        Are you sure you want to delete this voter?
      </p>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => {
            setShowDeleteModal(false);
            setDeleteVoterId(null);
          }}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
        >
          Cancel
        </button>

        <button
          onClick={async () => {
            await deleteVoter(deleteVoterId);
            setShowDeleteModal(false);
            setDeleteVoterId(null);
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

export default ManageVoters;