import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

// Helper function to get authenticated user
async function getAuthenticatedUser(ctx: any) {
	const userId = await getAuthUserId(ctx);
	if (!userId) {
		throw new Error('Not authenticated');
	}
	return userId;
}

// Search knowledge base
export const searchKnowledge = query({
	args: {
		searchTerm: v.string(),
		category: v.optional(
			v.union(
				v.literal('case_study'),
				v.literal('solution_template'),
				v.literal('pricing_model'),
				v.literal('team_bio'),
				v.literal('company_overview'),
				v.literal('technical_spec')
			)
		),
		industry: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await getAuthenticatedUser(ctx);

		const searchQuery = ctx.db
			.query('knowledgeBase')
			.withSearchIndex('search_content', (q) => {
				let query = q.search('content', args.searchTerm);
				if (args.category) {
					query = query.eq('category', args.category);
				}
				if (args.industry) {
					query = query.eq('industry', args.industry);
				}
				return query.eq('isApproved', true);
			});

		const results = await searchQuery.take(20);

		// Get creator details for each result
		const resultsWithCreators = await Promise.all(
			results.map(async (item) => {
				const creator = await ctx.db.get(item.createdBy);
				return {
					...item,
					creator: creator
						? { name: creator.name, email: creator.email }
						: null,
				};
			})
		);

		return resultsWithCreators;
	},
});

// List knowledge base items by category
export const listKnowledgeByCategory = query({
	args: {
		category: v.union(
			v.literal('case_study'),
			v.literal('solution_template'),
			v.literal('pricing_model'),
			v.literal('team_bio'),
			v.literal('company_overview'),
			v.literal('technical_spec')
		),
	},
	handler: async (ctx, args) => {
		await getAuthenticatedUser(ctx);

		const items = await ctx.db
			.query('knowledgeBase')
			.withIndex('by_category', (q) => q.eq('category', args.category))
			.filter((q) => q.eq(q.field('isApproved'), true))
			.collect();

		// Get creator details for each item
		const itemsWithCreators = await Promise.all(
			items.map(async (item) => {
				const creator = await ctx.db.get(item.createdBy);
				return {
					...item,
					creator: creator
						? { name: creator.name, email: creator.email }
						: null,
				};
			})
		);

		return itemsWithCreators;
	},
});

// Get knowledge base item
export const getKnowledgeItem = query({
	args: { itemId: v.id('knowledgeBase') },
	handler: async (ctx, args) => {
		await getAuthenticatedUser(ctx);

		const item = await ctx.db.get(args.itemId);
		if (!item) {
			throw new Error('Knowledge item not found');
		}

		const creator = await ctx.db.get(item.createdBy);

		return {
			...item,
			creator: creator ? { name: creator.name, email: creator.email } : null,
		};
	},
});

// Create knowledge base item
export const createKnowledgeItem = mutation({
	args: {
		title: v.string(),
		content: v.string(),
		category: v.union(
			v.literal('case_study'),
			v.literal('solution_template'),
			v.literal('pricing_model'),
			v.literal('team_bio'),
			v.literal('company_overview'),
			v.literal('technical_spec')
		),
		tags: v.array(v.string()),
		industry: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthenticatedUser(ctx);

		const itemId = await ctx.db.insert('knowledgeBase', {
			title: args.title,
			content: args.content,
			category: args.category,
			tags: args.tags,
			industry: args.industry,
			createdBy: userId,
			usageCount: 0,
			isApproved: false, // Requires approval
		});

		return itemId;
	},
});

// Approve knowledge base item
export const approveKnowledgeItem = mutation({
	args: { itemId: v.id('knowledgeBase') },
	handler: async (ctx, args) => {
		const userId = await getAuthenticatedUser(ctx);

		// Check if user has approval permissions
		const userProfile = await ctx.db
			.query('userProfiles')
			.withIndex('by_user', (q) => q.eq('userId', userId))
			.first();

		if (!userProfile || !userProfile.permissions.includes('approve')) {
			throw new Error('Insufficient permissions to approve knowledge items');
		}

		await ctx.db.patch(args.itemId, {
			isApproved: true,
		});

		return args.itemId;
	},
});

// Increment usage count
export const incrementUsageCount = mutation({
	args: { itemId: v.id('knowledgeBase') },
	handler: async (ctx, args) => {
		await getAuthenticatedUser(ctx);

		const item = await ctx.db.get(args.itemId);
		if (!item) {
			throw new Error('Knowledge item not found');
		}

		await ctx.db.patch(args.itemId, {
			usageCount: item.usageCount + 1,
		});

		return args.itemId;
	},
});
