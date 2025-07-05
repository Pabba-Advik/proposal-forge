import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState } from 'react';
import { Id } from '../../convex/_generated/dataModel';

interface ProposalEditorProps {
	proposal: any;
	onBack: () => void;
}

export function ProposalEditor({ proposal, onBack }: ProposalEditorProps) {
	const [activeSection, setActiveSection] = useState<string | null>(null);
	const [editingSection, setEditingSection] = useState<any>(null);

	const sections =
		useQuery(api.proposals.getProposalSections, {
			proposalId: proposal._id,
		}) || [];

	const updateStatus = useMutation(api.proposals.updateProposalStatus);
	const upsertSection = useMutation(api.proposals.upsertProposalSection);

	const sectionTypes = [
		{ id: 'executive_summary', title: 'Executive Summary', order: 1 },
		{ id: 'problem_statement', title: 'Problem Statement', order: 2 },
		{ id: 'solution', title: 'Solution', order: 3 },
		{ id: 'timeline', title: 'Timeline', order: 4 },
		{ id: 'pricing', title: 'Pricing', order: 5 },
		{ id: 'team', title: 'Team', order: 6 },
		{ id: 'case_studies', title: 'Case Studies', order: 7 },
		{ id: 'appendix', title: 'Appendix', order: 8 },
	];

	const handleStatusChange = async (newStatus: string) => {
		await updateStatus({
			proposalId: proposal._id,
			status: newStatus as any,
		});
	};

	const handleSaveSection = async (sectionData: any) => {
		await upsertSection({
			proposalId: proposal._id,
			sectionId: sectionData._id || undefined,
			title: sectionData.title,
			content: sectionData.content,
			sectionType: sectionData.sectionType,
			order: sectionData.order,
		});
		setEditingSection(null);
		setActiveSection(null);
	};

	const getSection = (sectionType: string) => {
		return sections.find((s) => s.sectionType === sectionType);
	};

	const createNewSection = (sectionType: any) => {
		setEditingSection({
			title: sectionType.title,
			content: '',
			sectionType: sectionType.id,
			order: sectionType.order,
		});
		setActiveSection(sectionType.id);
	};

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Header */}
			<div className='bg-white border-b sticky top-16 z-10'>
				<div className='max-w-7xl mx-auto px-6 py-4'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center space-x-4'>
							<button
								onClick={onBack}
								className='text-gray-600 hover:text-gray-900'
							>
								← Back to Proposals
							</button>
							<div>
								<h1 className='text-2xl font-bold text-gray-900'>
									{proposal.title}
								</h1>
								<p className='text-gray-600'>{proposal.organization?.name}</p>
							</div>
						</div>

						<div className='flex items-center space-x-4'>
							<select
								value={proposal.status}
								onChange={(e) => {
									void handleStatusChange(e.target.value);
								}}
								className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
							>
								<option value='draft'>Draft</option>
								<option value='in_review'>In Review</option>
								<option value='approved'>Approved</option>
								<option value='submitted'>Submitted</option>
								<option value='won'>Won</option>
								<option value='lost'>Lost</option>
							</select>

							<div className='text-sm text-gray-600'>
								<div>
									Deadline: {new Date(proposal.deadline).toLocaleDateString()}
								</div>
								<div>Value: ${proposal.estimatedValue.toLocaleString()}</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto p-6'>
				<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
					{/* Sidebar - Section Navigation */}
					<div className='lg:col-span-1'>
						<div className='bg-white rounded-lg shadow p-4 sticky top-32'>
							<h3 className='font-semibold text-gray-900 mb-4'>
								Proposal Sections
							</h3>
							<div className='space-y-2'>
								{sectionTypes.map((sectionType) => {
									const section = getSection(sectionType.id);
									const isActive = activeSection === sectionType.id;

									return (
										<div key={sectionType.id}>
											<button
												onClick={() => {
													if (section) {
														setEditingSection(section);
														setActiveSection(sectionType.id);
													} else {
														createNewSection(sectionType);
													}
												}}
												className={`w-full text-left px-3 py-2 rounded-md text-sm ${
													isActive
														? 'bg-blue-100 text-blue-700'
														: section
															? 'bg-green-50 text-green-700 hover:bg-green-100'
															: 'text-gray-600 hover:bg-gray-100'
												}`}
											>
												<div className='flex items-center justify-between'>
													<span>{sectionType.title}</span>
													{section ? (
														<span className='w-2 h-2 bg-green-500 rounded-full'></span>
													) : (
														<span className='text-gray-400'>+</span>
													)}
												</div>
											</button>
										</div>
									);
								})}
							</div>
						</div>
					</div>

					{/* Main Content Area */}
					<div className='lg:col-span-3'>
						{editingSection ? (
							<SectionEditor
								section={editingSection}
								onSave={(sectionData) => {
									void handleSaveSection(sectionData);
								}}
								onCancel={() => {
									setEditingSection(null);
									setActiveSection(null);
								}}
							/>
						) : (
							<div className='bg-white rounded-lg shadow p-8 text-center'>
								<h3 className='text-xl font-semibold text-gray-900 mb-4'>
									Select a section to edit
								</h3>
								<p className='text-gray-600 mb-6'>
									Choose a section from the sidebar to start building your
									proposal.
								</p>
								<div className='grid grid-cols-2 gap-4'>
									{sectionTypes.slice(0, 4).map((sectionType) => (
										<button
											key={sectionType.id}
											onClick={() => createNewSection(sectionType)}
											className='p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors'
										>
											<h4 className='font-medium text-gray-900'>
												{sectionType.title}
											</h4>
											<p className='text-sm text-gray-600 mt-1'>
												{getSection(sectionType.id)
													? 'Edit existing'
													: 'Create new'}
											</p>
										</button>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function SectionEditor({
	section,
	onSave,
	onCancel,
}: {
	section: any;
	onSave: (section: any) => void;
	onCancel: () => void;
}) {
	const [title, setTitle] = useState(section.title);
	const [content, setContent] = useState(section.content);

	const handleSave = () => {
		onSave({
			...section,
			title,
			content,
		});
	};

	return (
		<div className='bg-white rounded-lg shadow'>
			<div className='border-b p-6'>
				<div className='flex items-center justify-between'>
					<input
						type='text'
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className='text-2xl font-bold text-gray-900 bg-transparent border-none outline-none flex-1'
						placeholder='Section title'
					/>
					<div className='flex space-x-2'>
						<button
							onClick={onCancel}
							className='px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50'
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
						>
							Save Section
						</button>
					</div>
				</div>
			</div>

			<div className='p-6'>
				<textarea
					value={content}
					onChange={(e) => setContent(e.target.value)}
					rows={20}
					className='w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm'
					placeholder='Enter your content here. You can use Markdown formatting.'
				/>

				<div className='mt-4 text-sm text-gray-600'>
					<p>
						💡 <strong>Tips:</strong>
					</p>
					<ul className='list-disc list-inside mt-2 space-y-1'>
						<li>Use **bold** for emphasis</li>
						<li>Use - for bullet points</li>
						<li>Use ### for headings</li>
						<li>Use [link text](URL) for links</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
