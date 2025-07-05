import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles with role-based access
  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("presales"), v.literal("viewer")),
    department: v.string(),
    permissions: v.array(v.string()),
    isActive: v.boolean(),
  }).index("by_user", ["userId"]),

  // Organizations/Companies
  organizations: defineTable({
    name: v.string(),
    industry: v.string(),
    size: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
  }).index("by_creator", ["createdBy"]),

  // Proposals
  proposals: defineTable({
    title: v.string(),
    description: v.string(),
    organizationId: v.id("organizations"),
    status: v.union(
      v.literal("draft"),
      v.literal("in_review"),
      v.literal("approved"),
      v.literal("submitted"),
      v.literal("won"),
      v.literal("lost")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    deadline: v.number(),
    estimatedValue: v.number(),
    createdBy: v.id("users"),
    assignedTo: v.array(v.id("users")),
    tags: v.array(v.string()),
    currentVersion: v.number(),
    isTemplate: v.boolean(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_creator", ["createdBy"])
    .index("by_status", ["status"])
    .index("by_deadline", ["deadline"]),

  // Proposal sections/components
  proposalSections: defineTable({
    proposalId: v.id("proposals"),
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
    lastEditedBy: v.id("users"),
    version: v.number(),
    isLocked: v.boolean(),
  })
    .index("by_proposal", ["proposalId"])
    .index("by_proposal_order", ["proposalId", "order"]),

  // Knowledge base for reusable components
  knowledgeBase: defineTable({
    title: v.string(),
    content: v.string(),
    category: v.union(
      v.literal("case_study"),
      v.literal("solution_template"),
      v.literal("pricing_model"),
      v.literal("team_bio"),
      v.literal("company_overview"),
      v.literal("technical_spec")
    ),
    tags: v.array(v.string()),
    industry: v.optional(v.string()),
    createdBy: v.id("users"),
    usageCount: v.number(),
    isApproved: v.boolean(),
  })
    .index("by_category", ["category"])
    .index("by_creator", ["createdBy"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["category", "industry", "isApproved"],
    }),

  // Comments and collaboration
  comments: defineTable({
    proposalId: v.id("proposals"),
    sectionId: v.optional(v.id("proposalSections")),
    content: v.string(),
    authorId: v.id("users"),
    parentCommentId: v.optional(v.id("comments")),
    isResolved: v.boolean(),
  })
    .index("by_proposal", ["proposalId"])
    .index("by_section", ["sectionId"]),

  // Activity logs
  activities: defineTable({
    proposalId: v.id("proposals"),
    userId: v.id("users"),
    action: v.string(),
    details: v.string(),
    timestamp: v.number(),
  })
    .index("by_proposal", ["proposalId"])
    .index("by_user", ["userId"]),

  // Approval workflows
  approvals: defineTable({
    proposalId: v.id("proposals"),
    requestedBy: v.id("users"),
    approverRole: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    comments: v.optional(v.string()),
    requestedAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_proposal", ["proposalId"])
    .index("by_status", ["status"]),

  // File attachments
  attachments: defineTable({
    proposalId: v.id("proposals"),
    fileName: v.string(),
    fileType: v.string(),
    storageId: v.id("_storage"),
    uploadedBy: v.id("users"),
    size: v.number(),
  }).index("by_proposal", ["proposalId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
