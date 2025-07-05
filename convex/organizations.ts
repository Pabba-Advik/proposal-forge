import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper function to get authenticated user
async function getAuthenticatedUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

// List all organizations
export const listOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const organizations = await ctx.db.query("organizations").collect();
    
    // Get creator details for each organization
    const orgsWithCreators = await Promise.all(
      organizations.map(async (org) => {
        const creator = await ctx.db.get(org.createdBy);
        return {
          ...org,
          creator: creator ? { name: creator.name, email: creator.email } : null,
        };
      })
    );
    
    return orgsWithCreators;
  },
});

// Get organization details
export const getOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }
    
    const creator = await ctx.db.get(organization.createdBy);
    
    return {
      ...organization,
      creator: creator ? { name: creator.name, email: creator.email } : null,
    };
  },
});

// Create new organization
export const createOrganization = mutation({
  args: {
    name: v.string(),
    industry: v.string(),
    size: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      industry: args.industry,
      size: args.size,
      description: args.description,
      createdBy: userId,
    });
    
    return organizationId;
  },
});

// Update organization
export const updateOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    industry: v.string(),
    size: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }
    
    await ctx.db.patch(args.organizationId, {
      name: args.name,
      industry: args.industry,
      size: args.size,
      description: args.description,
    });
    
    return args.organizationId;
  },
});
