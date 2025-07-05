import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface CreateProposalModalProps {
  onClose: () => void;
  onSuccess: (proposalId: string) => void;
}

export function CreateProposalModal({ onClose, onSuccess }: CreateProposalModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    organizationId: "",
    priority: "medium" as const,
    deadline: "",
    estimatedValue: "",
    tags: "",
  });
  
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [orgData, setOrgData] = useState({
    name: "",
    industry: "",
    size: "",
    description: "",
  });

  const organizations = useQuery(api.organizations.listOrganizations, {}) || [];
  const createProposal = useMutation(api.proposals.createProposal);
  const createOrganization = useMutation(api.organizations.createOrganization);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let organizationId = formData.organizationId;
      
      // Create organization if needed
      if (showCreateOrg) {
        organizationId = await createOrganization(orgData);
      }
      
      const proposalId = await createProposal({
        title: formData.title,
        description: formData.description,
        organizationId: organizationId as Id<"organizations">,
        priority: formData.priority,
        deadline: new Date(formData.deadline).getTime(),
        estimatedValue: parseFloat(formData.estimatedValue),
        assignedTo: [], // Will be assigned later
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      });
      
      onSuccess(proposalId);
    } catch (error) {
      console.error("Error creating proposal:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create New Proposal</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proposal Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter proposal title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the proposal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization *
            </label>
            {!showCreateOrg ? (
              <div className="space-y-2">
                <select
                  required={!showCreateOrg}
                  value={formData.organizationId}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an organization</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.industry})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCreateOrg(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  + Create new organization
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">New Organization</h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateOrg(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required={showCreateOrg}
                      value={orgData.name}
                      onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry *
                    </label>
                    <input
                      type="text"
                      required={showCreateOrg}
                      value={orgData.industry}
                      onChange={(e) => setOrgData({ ...orgData, industry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Size *
                    </label>
                    <select
                      required={showCreateOrg}
                      value={orgData.size}
                      onChange={(e) => setOrgData({ ...orgData, size: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-1000">201-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline *
              </label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Value ($) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.estimatedValue}
              onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tags separated by commas"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
