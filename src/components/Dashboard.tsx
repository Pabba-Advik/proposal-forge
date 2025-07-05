import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface DashboardProps {
  onViewProposal: (proposalId: string) => void;
}

export function Dashboard({ onViewProposal }: DashboardProps) {
  const proposals = useQuery(api.proposals.listProposals, {}) || [];
  const userProfile = useQuery(api.proposals.getUserProfile);

  // Calculate statistics
  const stats = {
    total: proposals.length,
    draft: proposals.filter(p => p.status === "draft").length,
    inReview: proposals.filter(p => p.status === "in_review").length,
    approved: proposals.filter(p => p.status === "approved").length,
    won: proposals.filter(p => p.status === "won").length,
  };

  const recentProposals = proposals
    .sort((a, b) => b._creationTime - a._creationTime)
    .slice(0, 5);

  const urgentProposals = proposals
    .filter(p => p.deadline < Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
    .filter(p => p.status !== "won" && p.status !== "lost")
    .sort((a, b) => a.deadline - b.deadline);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {userProfile?.role} • {userProfile?.department}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard title="Total Proposals" value={stats.total} color="blue" />
        <StatCard title="Draft" value={stats.draft} color="gray" />
        <StatCard title="In Review" value={stats.inReview} color="yellow" />
        <StatCard title="Approved" value={stats.approved} color="green" />
        <StatCard title="Won" value={stats.won} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Proposals */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Proposals</h2>
          <div className="space-y-4">
            {recentProposals.map((proposal) => (
              <div
                key={proposal._id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => onViewProposal(proposal._id)}
              >
                <div>
                  <h3 className="font-medium">{proposal.title}</h3>
                  <p className="text-sm text-gray-600">{proposal.organization?.name}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={proposal.status} />
                  <p className="text-sm text-gray-500 mt-1">
                    ${proposal.estimatedValue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent Proposals */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Urgent Proposals</h2>
          <div className="space-y-4">
            {urgentProposals.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No urgent proposals</p>
            ) : (
              urgentProposals.map((proposal) => (
                <div
                  key={proposal._id}
                  className="flex items-center justify-between p-3 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer"
                  onClick={() => onViewProposal(proposal._id)}
                >
                  <div>
                    <h3 className="font-medium">{proposal.title}</h3>
                    <p className="text-sm text-gray-600">{proposal.organization?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      Due: {new Date(proposal.deadline).toLocaleDateString()}
                    </p>
                    <StatusBadge status={proposal.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    gray: "bg-gray-50 text-gray-700",
    yellow: "bg-yellow-50 text-yellow-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusColors = {
    draft: "bg-gray-100 text-gray-800",
    in_review: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    submitted: "bg-blue-100 text-blue-800",
    won: "bg-purple-100 text-purple-800",
    lost: "bg-red-100 text-red-800",
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
      statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
    }`}>
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
}
