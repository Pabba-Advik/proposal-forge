import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState } from 'react';

export function KnowledgeBase() {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [showCreateModal, setShowCreateModal] = useState(false);

	const searchResults = useQuery(
		api.knowledge.searchKnowledge,
		searchTerm
			? {
					searchTerm,
					category:
						selectedCategory !== 'all'
							? (selectedCategory as
									| 'case_study'
									| 'solution_template'
									| 'pricing_model'
									| 'team_bio'
									| 'company_overview'
									| 'technical_spec')
							: undefined,
					industry: undefined, // or provide a value for industry if needed
				}
			: 'skip'
	);

	const categoryItems = useQuery(
		api.knowledge.listKnowledgeByCategory,
		selectedCategory !== 'all' && !searchTerm
			? {
					category: selectedCategory as
						| 'case_study'
						| 'solution_template'
						| 'pricing_model'
						| 'team_bio'
						| 'company_overview'
						| 'technical_spec',
				}
			: 'skip'
	);

	const displayItems = searchResults || categoryItems || [];

	const categories = [
		{ id: 'all', label: 'All Categories' },
		{ id: 'case_study', label: 'Case Studies' },
		{ id: 'solution_template', label: 'Solution Templates' },
		{ id: 'pricing_model', label: 'Pricing Models' },
		{ id: 'team_bio', label: 'Team Bios' },
		{ id: 'company_overview', label: 'Company Overview' },
		{ id: 'technical_spec', label: 'Technical Specs' },
	];

	return (
		<div className='p-6 max-w-7xl mx-auto'>
			<div className='flex justify-between items-center mb-6'>
				<div>
					<h1 className='text-3xl font-bold text-gray-900 mb-2'>
						Knowledge Base
					</h1>
					<p className='text-gray-600'>Reusable content for your proposals</p>
				</div>
				<button
					onClick={() => setShowCreateModal(true)}
					className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
				>
					Add Content
				</button>
			</div>

			{/* Search and Filters */}
			<div className='bg-white rounded-lg shadow p-6 mb-6'>
				<div className='flex flex-col md:flex-row gap-4'>
					<div className='flex-1'>
						<input
							type='text'
							placeholder='Search knowledge base...'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>
					<div>
						<select
							value={selectedCategory}
							onChange={(e) => setSelectedCategory(e.target.value)}
							className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						>
							{categories.map((category) => (
								<option key={category.id} value={category.id}>
									{category.label}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{/* Results */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{displayItems.map((item: any) => (
					<KnowledgeCard key={item._id} item={item} />
				))}
			</div>

			{displayItems.length === 0 &&
				(searchTerm || selectedCategory !== 'all') && (
					<div className='text-center py-12'>
						<p className='text-gray-500 text-lg'>No content found</p>
						<button
							onClick={() => setShowCreateModal(true)}
							className='mt-4 text-blue-600 hover:text-blue-700'
						>
							Create new content
						</button>
					</div>
				)}

			{showCreateModal && (
				<CreateKnowledgeModal
					onClose={() => setShowCreateModal(false)}
					onSuccess={() => setShowCreateModal(false)}
				/>
			)}
		</div>
	);
}

function KnowledgeCard({ item }: { item: any }) {
	const incrementUsage = useMutation(api.knowledge.incrementUsageCount);

	const handleUse = (async () => {
		await incrementUsage({ itemId: item._id });
		// Copy to clipboard
		await navigator.clipboard.writeText(item.content);
	}) as () => Promise<void>;

	const getCategoryColor = (category: string) => {
		const colors = {
			case_study: 'bg-blue-100 text-blue-800',
			solution_template: 'bg-green-100 text-green-800',
			pricing_model: 'bg-purple-100 text-purple-800',
			team_bio: 'bg-yellow-100 text-yellow-800',
			company_overview: 'bg-indigo-100 text-indigo-800',
			technical_spec: 'bg-red-100 text-red-800',
		};
		return (
			colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
		);
	};

	return (
		<div className='bg-white rounded-lg shadow hover:shadow-md transition-shadow'>
			<div className='p-6'>
				<div className='flex justify-between items-start mb-3'>
					<h3 className='text-lg font-semibold text-gray-900 line-clamp-2'>
						{item.title}
					</h3>
					<span
						className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}
					>
						{item.category.replace('_', ' ').toUpperCase()}
					</span>
				</div>

				<p className='text-gray-600 text-sm mb-4 line-clamp-3'>
					{item.content.substring(0, 150)}...
				</p>

				<div className='flex justify-between items-center text-sm text-gray-500 mb-4'>
					<span>Used {item.usageCount} times</span>
					<span>By {item.creator?.name}</span>
				</div>

				{item.tags.length > 0 && (
					<div className='flex flex-wrap gap-1 mb-4'>
						{item.tags.slice(0, 3).map((tag: string, index: number) => (
							<span
								key={index}
								className='px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded'
							>
								{tag}
							</span>
						))}
						{item.tags.length > 3 && (
							<span className='px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded'>
								+{item.tags.length - 3}
							</span>
						)}
					</div>
				)}

				<button
					onClick={() => {
						void handleUse();
					}}
					className='w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors'
				>
					Use Content
				</button>
			</div>
		</div>
	);
}

function CreateKnowledgeModal({
	onClose,
	onSuccess,
}: {
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [formData, setFormData] = useState({
		title: '',
		content: '',
		category: 'solution_template' as const,
		tags: '',
		industry: '',
	});

	const createKnowledge = useMutation(api.knowledge.createKnowledgeItem);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		try {
			createKnowledge({
				title: formData.title,
				content: formData.content,
				category: formData.category,
				tags: formData.tags
					.split(',')
					.map((tag) => tag.trim())
					.filter(Boolean),
				industry: formData.industry || undefined,
			})
				.then(() => onSuccess())
				.catch((error) =>
					console.error('Error creating knowledge item:', error)
				);
		} catch (error) {
			console.error('Error creating knowledge item:', error);
		}
	};

	const categories = [
		{ id: 'case_study', label: 'Case Study' },
		{ id: 'solution_template', label: 'Solution Template' },
		{ id: 'pricing_model', label: 'Pricing Model' },
		{ id: 'team_bio', label: 'Team Bio' },
		{ id: 'company_overview', label: 'Company Overview' },
		{ id: 'technical_spec', label: 'Technical Spec' },
	];

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
			<div className='bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
				<div className='flex justify-between items-center mb-6'>
					<h2 className='text-2xl font-bold'>Add Knowledge Content</h2>
					<button
						onClick={onClose}
						className='text-gray-500 hover:text-gray-700'
					>
						✕
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-6'>
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Title *
						</label>
						<input
							type='text'
							required
							value={formData.title}
							onChange={(e) =>
								setFormData({ ...formData, title: e.target.value })
							}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
							placeholder='Enter content title'
						/>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Category *
						</label>
						<select
							required
							value={formData.category}
							onChange={(e) =>
								setFormData({ ...formData, category: e.target.value as any })
							}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						>
							{categories.map((category) => (
								<option key={category.id} value={category.id}>
									{category.label}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Content *
						</label>
						<textarea
							required
							value={formData.content}
							onChange={(e) =>
								setFormData({ ...formData, content: e.target.value })
							}
							rows={10}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
							placeholder='Enter your reusable content here...'
						/>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Industry
						</label>
						<input
							type='text'
							value={formData.industry}
							onChange={(e) =>
								setFormData({ ...formData, industry: e.target.value })
							}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
							placeholder='e.g., Technology, Healthcare, Finance'
						/>
					</div>

					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Tags
						</label>
						<input
							type='text'
							value={formData.tags}
							onChange={(e) =>
								setFormData({ ...formData, tags: e.target.value })
							}
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
							placeholder='Enter tags separated by commas'
						/>
					</div>

					<div className='flex justify-end space-x-4'>
						<button
							type='button'
							onClick={onClose}
							className='px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50'
						>
							Cancel
						</button>
						<button
							type='submit'
							className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
						>
							Add Content
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
