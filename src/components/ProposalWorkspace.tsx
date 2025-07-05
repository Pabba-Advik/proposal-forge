import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState } from 'react';
import { Id } from '../../convex/_generated/dataModel';
import { CreateProposalModal } from './CreateProposalModal';
import { ProposalEditor } from './ProposalEditor';
interface ProposalWorkspaceProps {
	selectedProposalId: string | null;
	onSelectProposal: (id: string | null) => void;
}
export function ProposalWorkspace({
	selectedProposalId,
	onSelectProposal,
}: ProposalWorkspaceProps) {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [statusFilter, setStatusFilter] = useState<string>('all');

	const proposals = useQuery(api.proposals.listProposals, {}) || [];
	const selectedProposal = useQuery(
		api.proposals.getProposal,
		selectedProposalId
			? { proposalId: selectedProposalId as Id<'proposals'> }
			: 'skip'
	);

	const filteredProposals =
		statusFilter === 'all'
			? proposals
			: proposals.filter((p) => p.status === statusFilter);

	if (selectedProposalId && selectedProposal) {
		return (
			<ProposalEditor
				proposal={selectedProposal}
				onBack={() => onSelectProposal(null)}
			/>
		);
	}

	return (
		<div className='p-6 max-w-7xl mx-auto'>
			<div className='flex justify-between items-center mb-6'>
				{/* TODO: Replace with actual user object from context or props */}
				<div>
					<h1 className='text-3xl font-bold text-gray-900 mb-2'>Proposals</h1>
					<p className='text-gray-600'>
						Manage and collaborate on your proposals
					</p>
				</div>
				<button
					onClick={() => setShowCreateModal(true)}
					className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
				>
					Create Proposal
				</button>
			</div>

			{/* Filters */}
			<div className='mb-6'>
				<div className='flex space-x-2'>
					{[
						'all',
						'draft',
						'in_review',
						'approved',
						'submitted',
						'won',
						'lost',
					].map((status) => (
						<button
							key={status}
							onClick={() => setStatusFilter(status)}
							className={`px-3 py-2 rounded-md text-sm font-medium ${
								statusFilter === status
									? 'bg-blue-100 text-blue-700'
									: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
							}`}
						>
							{status === 'all'
								? 'All'
								: status.replace('_', ' ').toUpperCase()}
						</button>
					))}
				</div>
			</div>

			{/* Proposals Grid */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{filteredProposals.map((proposal) => (
					<ProposalCard
						key={proposal._id}
						proposal={proposal}
						onClick={() => onSelectProposal(proposal._id)}
					/>
				))}
			</div>

			{filteredProposals.length === 0 && (
				<div className='text-center py-12'>
					<p className='text-gray-500 text-lg'>No proposals found</p>
					<button
						onClick={() => setShowCreateModal(true)}
						className='mt-4 text-blue-600 hover:text-blue-700'
					>
						Create your first proposal
					</button>
				</div>
			)}

			{showCreateModal && (
				<CreateProposalModal
					onClose={() => setShowCreateModal(false)}
					onSuccess={(proposalId) => {
						setShowCreateModal(false);
						onSelectProposal(proposalId);
					}}
				/>
			)}
		</div>
	);
}

function ProposalCard({
	proposal,
	onClick,
}: {
	proposal: any;
	onClick: () => void;
}) {
	const updateStatus = useMutation(api.proposals.updateProposalStatus);

	const handleStatusChange = async (e: React.MouseEvent, newStatus: string) => {
		e.stopPropagation();
		await updateStatus({
			proposalId: proposal._id,
			status: newStatus as any,
		});
	};

	const daysUntilDeadline = Math.ceil(
		(proposal.deadline - Date.now()) / (1000 * 60 * 60 * 24)
	);
	const isUrgent = daysUntilDeadline <= 7 && daysUntilDeadline > 0;
	const isOverdue = daysUntilDeadline < 0;

	return (
		<div
			className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
				isOverdue
					? 'border-red-500'
					: isUrgent
						? 'border-yellow-500'
						: 'border-blue-500'
			}`}
			onClick={onClick}
		>
			<div className='p-6'>
				<div className='flex justify-between items-start mb-3'>
					<h3 className='text-lg font-semibold text-gray-900 line-clamp-2'>
						{proposal.title}
					</h3>
					<StatusBadge status={proposal.status} />
				</div>

				<p className='text-gray-600 text-sm mb-3 line-clamp-2'>
					{proposal.description}
				</p>

				<div className='space-y-2 text-sm'>
					<div className='flex justify-between'>
						<span className='text-gray-500'>Organization:</span>
						<span className='font-medium'>{proposal.organization?.name}</span>
					</div>

					<div className='flex justify-between'>
						<span className='text-gray-500'>Value:</span>
						<span className='font-medium'>
							${proposal.estimatedValue.toLocaleString()}
						</span>
					</div>

					<div className='flex justify-between'>
						<span className='text-gray-500'>Deadline:</span>
						<span
							className={`font-medium ${
								isOverdue
									? 'text-red-600'
									: isUrgent
										? 'text-yellow-600'
										: 'text-gray-900'
							}`}
						>
							{new Date(proposal.deadline).toLocaleDateString()}
							{isOverdue && ' (Overdue)'}
							{isUrgent && !isOverdue && ` (${daysUntilDeadline} days)`}
						</span>
					</div>

					<div className='flex justify-between'>
						<span className='text-gray-500'>Priority:</span>
						<PriorityBadge priority={proposal.priority} />
					</div>
				</div>

				<div className='mt-4 pt-4 border-t'>
					<div className='flex justify-between items-center'>
						<span className='text-xs text-gray-500'>
							Created by {proposal.creator?.name}
						</span>
						<div className='flex space-x-1'>
							{proposal.assignedUsers
								?.slice(0, 3)
								.map((user: any, index: number) => (
									<div
										key={user._id}
										className='w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs'
										title={user.name}
									>
										{user.name?.charAt(0).toUpperCase()}
									</div>
								))}
							{proposal.assignedUsers?.length > 3 && (
								<div className='w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs'>
									+{proposal.assignedUsers.length - 3}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	const statusColors = {
		draft: 'bg-gray-100 text-gray-800',
		in_review: 'bg-yellow-100 text-yellow-800',
		approved: 'bg-green-100 text-green-800',
		submitted: 'bg-blue-100 text-blue-800',
		won: 'bg-purple-100 text-purple-800',
		lost: 'bg-red-100 text-red-800',
	};

	return (
		<span
			className={`px-2 py-1 text-xs font-medium rounded-full ${
				statusColors[status as keyof typeof statusColors] ||
				'bg-gray-100 text-gray-800'
			}`}
		>
			{status.replace('_', ' ').toUpperCase()}
		</span>
	);
}

function PriorityBadge({ priority }: { priority: string }) {
	const priorityColors = {
		low: 'bg-green-100 text-green-800',
		medium: 'bg-yellow-100 text-yellow-800',
		high: 'bg-orange-100 text-orange-800',
		critical: 'bg-red-100 text-red-800',
	};

	return (
		<span
			className={`px-2 py-1 text-xs font-medium rounded-full ${
				priorityColors[priority as keyof typeof priorityColors] ||
				'bg-gray-100 text-gray-800'
			}`}
		>
			{priority.toUpperCase()}
		</span>
	);
}
// <ChatPanel proposalId={proposal.id} currentUserId={user.id} />;
