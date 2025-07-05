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

// Get user profile with permissions
export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!profile) {
      // Create default profile for new users
      return {
        userId,
        role: "presales" as const,
        department: "Sales",
        permissions: ["read", "write"],
        isActive: true,
      };
    }
    
    return profile;
  },
});

// Create user profile
export const createUserProfile = mutation({
  args: {
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("presales"), v.literal("viewer")),
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existing) {
      throw new Error("User profile already exists");
    }
    
    const permissions = args.role === "admin" 
      ? ["read", "write", "delete", "approve", "manage_users"]
      : args.role === "manager"
      ? ["read", "write", "approve"]
      : ["read", "write"];
    
    return await ctx.db.insert("userProfiles", {
      userId,
      role: args.role,
      department: args.department,
      permissions,
      isActive: true,
    });
  },
});

// List all proposals with filters
export const listProposals = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("in_review"),
      v.literal("approved"),
      v.literal("submitted"),
      v.literal("won"),
      v.literal("lost")
    )),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    let proposals;
    
    if (args.status && args.organizationId) {
      // If both filters are provided, use organization filter first
      proposals = await ctx.db
        .query("proposals")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId!))
        .filter((q) => q.eq(q.field("status"), args.status!))
        .collect();
    } else if (args.status) {
      proposals = await ctx.db
        .query("proposals")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else if (args.organizationId) {
      proposals = await ctx.db
        .query("proposals")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId!))
        .collect();
    } else {
      proposals = await ctx.db.query("proposals").collect();
    }
    
    // Get organization details for each proposal
    const proposalsWithOrgs = await Promise.all(
      proposals.map(async (proposal) => {
        const organization = await ctx.db.get(proposal.organizationId);
        const creator = await ctx.db.get(proposal.createdBy);
        return {
          ...proposal,
          organization,
          creator: creator ? { name: creator.name, email: creator.email } : null,
        };
      })
    );
    
    return proposalsWithOrgs;
  },
});

// Get proposal details
export const getProposal = query({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }
    
    const organization = await ctx.db.get(proposal.organizationId);
    const creator = await ctx.db.get(proposal.createdBy);
    
    // Get assigned users
    const assignedUsers = await Promise.all(
      proposal.assignedTo.map(async (userId) => {
        const user = await ctx.db.get(userId);
        return user ? { _id: user._id, name: user.name, email: user.email } : null;
      })
    );
    
    return {
      ...proposal,
      organization,
      creator: creator ? { name: creator.name, email: creator.email } : null,
      assignedUsers: assignedUsers.filter(Boolean),
    };
  },
});

// Create new proposal
export const createProposal = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    organizationId: v.id("organizations"),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    deadline: v.number(),
    estimatedValue: v.number(),
    assignedTo: v.array(v.id("users")),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const proposalId = await ctx.db.insert("proposals", {
      title: args.title,
      description: args.description,
      organizationId: args.organizationId,
      status: "draft",
      priority: args.priority,
      deadline: args.deadline,
      estimatedValue: args.estimatedValue,
      createdBy: userId,
      assignedTo: args.assignedTo,
      tags: args.tags,
      currentVersion: 1,
      isTemplate: false,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      proposalId,
      userId,
      action: "created",
      details: `Created proposal: ${args.title}`,
      timestamp: Date.now(),
    });
    
    return proposalId;
  },
});

// Update proposal status
export const updateProposalStatus = mutation({
  args: {
    proposalId: v.id("proposals"),
    status: v.union(
      v.literal("draft"),
      v.literal("in_review"),
      v.literal("approved"),
      v.literal("submitted"),
      v.literal("won"),
      v.literal("lost")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }
    
    await ctx.db.patch(args.proposalId, {
      status: args.status,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      proposalId: args.proposalId,
      userId,
      action: "status_updated",
      details: `Status changed to: ${args.status}`,
      timestamp: Date.now(),
    });
    
    return args.proposalId;
  },
});

// Get proposal sections
export const getProposalSections = query({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    const sections = await ctx.db
      .query("proposalSections")
      .withIndex("by_proposal_order", (q) => q.eq("proposalId", args.proposalId))
      .collect();
    
    // Get editor details for each section
    const sectionsWithEditors = await Promise.all(
      sections.map(async (section) => {
        const editor = await ctx.db.get(section.lastEditedBy);
        return {
          ...section,
          lastEditedBy: editor ? { name: editor.name, email: editor.email } : null,
        };
      })
    );
    
    return sectionsWithEditors.sort((a, b) => a.order - b.order);
  },
});

// Create or update proposal section
export const upsertProposalSection = mutation({
  args: {
    proposalId: v.id("proposals"),
    sectionId: v.optional(v.id("proposalSections")),
    title: v.string(),
    content: v.string(),
    sectionType: v.union(
      v.literal("executive_summary"),
      v.literal("problem_statement"),
      v.literal("solution"),
      v.literal("timeline"),
      v.literal("pricing"),
      v.literal("team"),
      v.literal("case_studies"),
      v.literal("appendix")
    ),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);
    
    if (args.sectionId) {
      // Update existing section
      const section = await ctx.db.get(args.sectionId);
      if (!section) {
        throw new Error("Section not found");
      }
      
      await ctx.db.patch(args.sectionId, {
        title: args.title,
        content: args.content,
        sectionType: args.sectionType,
        order: args.order,
        lastEditedBy: userId,
        version: section.version + 1,
      });
      
      return args.sectionId;
    } else {
      // Create new section
      const sectionId = await ctx.db.insert("proposalSections", {
        proposalId: args.proposalId,
        title: args.title,
        content: args.content,
        sectionType: args.sectionType,
        order: args.order,
        lastEditedBy: userId,
        version: 1,
        isLocked: false,
      });
      
      // Log activity
      await ctx.db.insert("activities", {
        proposalId: args.proposalId,
        userId,
        action: "section_created",
        details: `Created section: ${args.title}`,
        timestamp: Date.now(),
      });
      
      return sectionId;
    }
  },
});
