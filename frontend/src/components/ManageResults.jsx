import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

function ManageResults() {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");

  /* ================= FETCH ELECTIONS ================= */
  useEffect(() => {
    const fetchElections = async () => {
      const res = await fetch("http://127.0.0.1:5000/api/elections/");
      const data = await res.json();
      setElections(data);
    };
    fetchElections();
  }, []);

  /* ================= FETCH RESULTS ================= */
  const fetchResults = async () => {
    if (!selectedElection) {
      setMessage("Please select an election first.");
      return;
    }

    const res = await fetch(
      `http://127.0.0.1:5000/api/elections/${selectedElection}/results`
    );

    const data = await res.json();

    if (res.ok) {
      setResults(data);
      setMessage("");
    } else {
      setMessage(data.error);
    }
  };

  /* ================= CALCULATIONS ================= */
  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);

  const winner =
    results.length > 0
      ? results.reduce((prev, current) =>
          prev.votes > current.votes ? prev : current
        )
      : null;

  /* ================= CHART DATA ================= */
  const chartData = {
    labels: results.map((r) => r.name),
    datasets: [
      {
        label: "Votes",
        data: results.map((r) => r.votes),
        backgroundColor: "#2563eb",
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-6xl space-y-10">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Election Results
          </h2>
          <div className="w-20 h-1 bg-blue-600 mt-2 rounded"></div>
        </div>

        {/* Control Card */}
        <div className="bg-white rounded-2xl shadow-lg border p-6 flex gap-6 items-center">
          <select
            value={selectedElection}
            onChange={(e) => setSelectedElection(e.target.value)}
            className="w-72 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Election</option>
            {elections.map((e) => (
              <option key={e.election_id} value={e.election_id}>
                {e.title}
              </option>
            ))}
          </select>

          <button
            onClick={fetchResults}
            className="px-6 py-3 rounded-lg text-white font-semibold
                       bg-blue-600 hover:bg-blue-700 transition"
          >
            View Results
          </button>
        </div>

        {/* Error */}
        {message && (
          <div className="text-red-600 font-medium">{message}</div>
        )}

        {results.length > 0 && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6">

              {/* Total Votes */}
              <div className="bg-white rounded-xl shadow border p-6 text-center">
                <p className="text-gray-500 text-sm">Total Votes</p>
                <p className="text-2xl font-bold text-gray-800">
                  {totalVotes}
                </p>
              </div>

              {/* Winner */}
              {winner && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl shadow p-6 text-center">
                  <p className="text-gray-500 text-sm">Winner</p>
                  <p className="text-xl font-semibold text-blue-700">
                    🏆 {winner.name}
                  </p>
                </div>
              )}

              {/* Candidates Count */}
              <div className="bg-white rounded-xl shadow border p-6 text-center">
                <p className="text-gray-500 text-sm">Candidates</p>
                <p className="text-2xl font-bold text-gray-800">
                  {results.length}
                </p>
              </div>

            </div>

            {/* Candidate List */}
            <div className="bg-white rounded-2xl shadow border p-8 space-y-6">

              <h3 className="text-lg font-semibold text-gray-800">
                Vote Breakdown
              </h3>

              {results.map((r) => {
                const percentage =
                  totalVotes > 0
                    ? ((r.votes / totalVotes) * 100).toFixed(1)
                    : 0;

                const isWinner =
                  winner && r.candidate_id === winner.candidate_id;

                return (
                  <div key={r.candidate_id} className="space-y-2">

                    <div className="flex justify-between">
                      <span className={`font-medium ${isWinner ? "text-blue-700" : "text-gray-800"}`}>
                        {r.name} {isWinner && "🏆"}
                      </span>

                      <span className="text-sm text-gray-600">
                        {r.votes} Votes ({percentage}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          isWinner ? "bg-blue-600" : "bg-blue-400"
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                  </div>
                );
              })}

            </div>

            {/* Chart */}
            <div className="bg-white rounded-2xl shadow border p-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">
                Vote Distribution Chart
              </h3>

              <div className="h-80">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ManageResults;