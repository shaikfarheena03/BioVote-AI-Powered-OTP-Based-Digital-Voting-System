import { useState, useEffect, useRef } from "react";

function VoterPortal() {
  const [voterId, setVoterId] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [activeElection, setActiveElection] = useState(null);


  const videoRef = useRef(null);

  /* ================================
        STEP 1 – VERIFY VOTER ID
  ================================= */
  const verifyVoter = async () => {
    if (!voterId) {
      setError("Please enter Voter ID");
      return;
    }

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/voters/${voterId}`
      );

      const data = await res.json();

      if (res.ok) {
        setError("");
        setStep(2);
      } else {
        setError(data.error || "Voter not found");
      }

    } catch (err) {
      setError("Server error. Try again.");
    }
  };

  /* ================================
        STEP 2 – OPEN CAMERA
  ================================= */
  useEffect(() => {
    if (step === 2) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          setError("Camera access denied");
        });
    }
  }, [step]);

const captureAndVerify = async () => {
  if (!videoRef.current) return;

  setError("");
  const frames = [];
  const captureDuration = 2500; // 3 seconds
  const intervalTime = 80;     // capture every 200ms

  const startTime = Date.now();

  const interval = setInterval(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);

    const base64Image = canvas.toDataURL("image/jpeg");
    frames.push(base64Image);

    if (Date.now() - startTime > captureDuration) {
      clearInterval(interval);
      sendForLiveness(frames);
    }
  }, intervalTime);
};

const sendForLiveness = async (frames) => {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/auth/liveness-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        voter_id: voterId,
        frames: frames
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Liveness check failed");
      return;
    }

    // If liveness passed → call original face verify
    await verifyFaceAfterLiveness();

  } catch (err) {
    setError("Server error during liveness check");
  }
};
const verifyFaceAfterLiveness = async () => {
  if (!videoRef.current) return;

  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 240;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoRef.current, 0, 0,320,240);

  const base64Image = canvas.toDataURL("image/jpeg").split(",")[1];

  try {
    const res = await fetch("http://127.0.0.1:5000/api/auth/face-verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        voter_id: voterId,
        face_image: base64Image
      })
    });

    const data = await res.json();

    if (res.ok) {
      setError("");
      setAuthSuccess(true);

      const stream = videoRef.current.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      setTimeout(() => {
        setStep(3);
      }, 1500);
    } else {
      setError(data.error || "Face verification failed");
    }

  } catch (err) {
    setError("Server error during face verification");
  }
};

  /* ================================
        STEP 3 – Send & VERIFY OTP
  ================================= */
  const sendOtp = async () => {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ voter_id: voterId }),
    });

    const data = await res.json();

    if (res.ok) {
      setOtpSent(true);
      setError("");
    } else {
      setError(data.error);
    }

  } catch (err) {
    setError("Failed to send OTP");
  }
};

const verifyOtp = async () => {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voter_id: voterId,
        otp: otp,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setOtpVerified(true);
      setError("");

      setTimeout(() => {
        setStep(4);
      }, 1200);

    } else {
      setError(data.error);
    }

  } catch (err) {
    setError("OTP verification failed");
  }
};

useEffect(() => {
  if (step === 4) {
    fetchCandidates();
  }
}, [step]);

const castVote = async () => {
  if (!selectedCandidate) {
    setError("Please select a candidate");
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:5000/api/vote/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voter_id: voterId,
        candidate_id: selectedCandidate,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setVoteSuccess(true);
      setError("");
    } else {
      setError(data.error);
    }

  } catch (err) {
    setError("Voting failed");
  }
};


  const fetchCandidates = async () => {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/candidates/");
    const data = await res.json();

    if (!res.ok) {
      
      if (data.error === "No active election found") {
        setCandidates([]);
        setError("No active election currently.");
      } else {
        setError(data.error || "Failed to load candidates");
      }
      return;
    }

    setCandidates(data);
    setError("");

  } catch (err) {
    setError("Failed to load candidates");
  }
};

const fetchActiveElection = async () => {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/elections/active");
    const data = await res.json();

    if (res.ok) {
      setActiveElection(data);
    } else {
      setActiveElection(null);
    }
  } catch (error) {
    console.error("Error fetching active election:", error);
    setActiveElection(null);
  }
};
useEffect(() => {
  fetchActiveElection();
}, []);

 /* ================================
        UI
================================= */
return (
  <div className="w-full max-w-xl relative">


    <div className="relative w-full max-w-2xl bg-white border border-gray-200 shadow-xl rounded-2xl p-12">
      
    {/* Watermark */}
    <img
      src="/SPMVV_LOGO.png"
      alt="University Seal"
      className="absolute inset-0 m-auto h-[60%] opacity-[0.04] object-contain pointer-events-none select-none"
    />

      {/* ================= STEP 1 ================= */}
      {step === 1 && (
        <>
          <div className="text-center mb-10">
            <p className="text-xs tracking-widest text-gray-500">
              SPMVV
            </p>
            <p className="text-sm text-gray-600">
              University Election Portal
            </p>

            <h1 className="text-2xl font-semibold text-gray-800 mt-4">
              Voter Verification
            </h1>
          </div>

          <input
            type="text"
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
            placeholder="Enter Voter ID"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          {error && (
            <div className="mb-6 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={verifyVoter}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg transition"
          >
            Continue
          </button>
        </>
      )}

      {/* ================= STEP 2 ================= */}
      {step === 2 && (
        <>
          <h2 className="text-xl font-semibold text-gray-800 text-center mb-8">
            Face Authentication
          </h2>

          <div className="flex flex-col items-center">
            <video
              ref={videoRef}
              autoPlay
              className="w-72 h-52 rounded-lg border border-gray-300 mb-6"
            />

            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            {authSuccess && (
              <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-green-600 text-sm text-center">
                Face Authenticated Successfully
              </div>
            )}

            {!authSuccess && (
              <button
                onClick={captureAndVerify}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg transition"
              >
                Verify Face
              </button>
            )}
          </div>
        </>
      )}

      {/* ================= STEP 3 ================= */}
      {step === 3 && (
        <>
          <h2 className="text-xl font-semibold text-gray-800 text-center mb-8">
            OTP Verification
          </h2>

          <div className="flex flex-col items-center">
            {!otpSent ? (
              <button
                onClick={sendOtp}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg transition mb-6"
              >
                Send OTP
              </button>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-64 border border-gray-300 rounded-lg px-4 py-3 mb-6
                             focus:outline-none focus:ring-2 focus:ring-blue-600"
                />

                <button
                  onClick={verifyOtp}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg transition"
                >
                  Verify OTP
                </button>
              </>
            )}

            {error && (
              <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            {otpVerified && (
              <div className="mt-4 p-3 rounded bg-green-50 border border-green-200 text-green-600 text-sm text-center">
                OTP Verified Successfully
              </div>
            )}
          </div>
        </>
      )}

 {/* ================= STEP 4 ================= */}

  {step === 4 && !voteSuccess && (
  <>
    <div className="text-center mb-8">

      {activeElection ? (
        <>
          <p className="text-sm text-gray-500 uppercase tracking-wide">
            Active Election
          </p>
          <h2 className="text-2xl font-bold text-blue-700 mt-1">
            {activeElection.title}
          </h2>

          <h2 className="text-xl font-semibold text-gray-800 mt-4">
            Cast Your Vote
          </h2>
        </>
      ) : (
        <div className="mt-4 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <h3 className="text-lg font-semibold text-red-600">
            No Active Election
          </h3>
          <p className="text-gray-600 mt-2">
            Voting is currently closed.
          </p>
        </div>
      )}

    </div>

    {/* ONLY show candidates + button if election exists */}
    {activeElection && (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {candidates.map((c) => (
            <div
              key={c.candidate_id}
              onClick={() => setSelectedCandidate(c.candidate_id)}
              className={`p-6 rounded-xl cursor-pointer border transition-all duration-300
                ${
                  selectedCandidate === c.candidate_id
                    ? "bg-blue-600 text-white border-blue-400 shadow-lg scale-105"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
            >
              <h3 className="text-lg font-semibold text-center">
                {c.name}
              </h3>
            </div>
          ))}

        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-100 border border-red-300 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={castVote}
            className="px-8 py-3 rounded-lg font-semibold
                       bg-blue-700 hover:bg-blue-800
                       text-white transition duration-300 shadow-md"
          >
            Submit Vote
          </button>
        </div>
      </>
    )}
  </>
)}

      {/* ================= SUCCESS ================= */}
      {voteSuccess && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            Vote Cast Successfully
          </h2>
          <p className="text-gray-600">
            Thank you for participating in the election.
          </p>
        </div>
      )}

    </div>
  </div>
);
}

export default VoterPortal;
