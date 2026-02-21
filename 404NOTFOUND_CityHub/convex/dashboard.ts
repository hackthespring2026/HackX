import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMyCommunitiesSnapshot = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // 1. Get groups user has joined
    const Memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const groupsWithDetails = await Promise.all(
      Memberships.map(async (membership) => {
        const group = await ctx.db.get(membership.groupId);
        if (!group) return null;

        // Count total members
        const allMembers = await ctx.db
          .query("groupMembers")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect();

        // Get cover image URL
        const coverImageUrl = group.coverImageId
          ? await ctx.storage.getUrl(group.coverImageId)
          : null;

        // Check for active proposals (simple metric for governance status)
        const activeProposals = await ctx.db
          .query("governanceProposals")
          .withIndex("by_group_status", (q) =>
            q.eq("groupId", group._id).eq("status", "voting")
          )
          .collect();

        const governanceStatus = activeProposals.length > 0 ? "Action Needed" : "Healthy";

        // Count pending join requests (if manager)
        let pendingJoinRequests = 0;
        if (membership.role === "manager") {
          const requests = await ctx.db
            .query("joinRequests")
            .withIndex("by_group", (q) => q.eq("groupId", group._id))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();
          pendingJoinRequests = requests.length;
        }

        return {
          ...group,
          coverImageUrl,
          role: membership.role,
          memberCount: allMembers.length,
          governanceStatus,
          pendingJoinRequests,
          unreadMessages: 0, // Placeholder for now - depends on how notifications/read receipt are handled
        };
      })
    );

    return groupsWithDetails.filter((g) => g !== null);
  },
});

export const getGovernanceAlerts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Get all groups where user is a manager
    const managerMemberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("role"), "manager"))
      .collect();

    const groupIds = managerMemberships.map((m) => m.groupId);

    const pendingRequests = [];
    const activeProposals = [];

    // Aggregate governance items across all managed groups
    for (const groupId of groupIds) {
      const groupInfo = await ctx.db.get(groupId);

      // Pending Join Requests
      const requests = await ctx.db
        .query("joinRequests")
        .withIndex("by_group", (q) => q.eq("groupId", groupId))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();

      for (const req of requests) {
         // Get requester details
         const requester = await ctx.db
           .query("users")
           .withIndex("by_userId", (q) => q.eq("userId", req.userId))
           .first();
           
         pendingRequests.push({ ...req, groupName: groupInfo?.name, requester });
      }

      // Active Governance Proposals (e.g. votes expiring soon)
      const proposals = await ctx.db
        .query("governanceProposals")
        .withIndex("by_group_status", (q) =>
          q.eq("groupId", groupId).eq("status", "voting")
        )
        .collect();
      
      for(const prop of proposals) {
          activeProposals.push({ ...prop, groupName: groupInfo?.name });
      }
    }

    return {
      pendingJoinRequests: pendingRequests,
      activeProposals,
    };
  },
});

export const getUpcomingEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // 1. Get groups user has joined
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const groupIds = memberships.map((m) => m.groupId);
    const now = Date.now();

    let upcomingEvents = [];

    for (const groupId of groupIds) {
      const group = await ctx.db.get(groupId);
      const events = await ctx.db
        .query("events")
        .withIndex("by_group", (q) => q.eq("groupId", groupId))
        .filter((q) => q.gt(q.field("startTime"), now))
        .collect();

      for (const event of events) {
          const coverImageUrl = event.coverImageId
          ? await ctx.storage.getUrl(event.coverImageId)
          : null;

          upcomingEvents.push({ 
            ...event, 
            groupName: group?.name,
            coverImageUrl, 
            isGoing: event.attendees.includes(userId) 
          });
      }
    }

    // Sort by nearest date ascending
    upcomingEvents.sort((a, b) => a.startTime - b.startTime);

    return upcomingEvents;
  },
});

export const getActivityStream = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

     // 1. Get groups user has joined
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const groupIds = memberships.map((m) => m.groupId);
    let feedItems = [];

    for (const groupId of groupIds) {
        const groupInfo = await ctx.db.get(groupId);

        // Fetch recent active polls
        const polls = await ctx.db
          .query("polls")
          .withIndex("by_group", (q) => q.eq("groupId", groupId))
          .order("desc")
          .take(5);
        
        for (const poll of polls) {
           feedItems.push({
             type: 'poll',
             data: poll,
             timestamp: poll.createdAt,
             groupName: groupInfo?.name
           })
        }

        // Fetch recent events created
        const events = await ctx.db
          .query("events")
          .withIndex("by_group", (q) => q.eq("groupId", groupId))
          .order("desc") // requires index by group & createdAt ideally, or fallback to filter
          .take(5);
          
        for (const event of events) {
          feedItems.push({
            type: 'event_created',
            data: event,
            timestamp: event.startTime, // Or a dedicated createdAt field if exists
            groupName: groupInfo?.name
          })
        }
        
        // Fetch recent announcements (from manager-only channels)
        const channels = await ctx.db
            .query("channels")
            .withIndex("by_group", (q) => q.eq("groupId", groupId))
            .filter((q) => q.eq(q.field("isManagerOnlyPost"), true))
            .collect();

        for (const channel of channels) {
             const messages = await ctx.db
                .query("messages")
                .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
                .order("desc")
                .take(3);

             for (const msg of messages) {
                  feedItems.push({
                      type: 'announcement',
                      data: msg,
                      timestamp: msg.createdAt,
                      groupName: groupInfo?.name,
                      channelName: channel.name
                  })
             }
        }
    }

    // Sort combined feed by timestamp descending
    feedItems.sort((a, b) => b.timestamp - a.timestamp);

    // Return the latest 20 items across all groups
    return feedItems.slice(0, 20);
  }
})

export const getNotificationSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("isRead", false))
      .collect();

    const mentionsCount = unreadNotifications.filter((n) => n.type === "mention").length;
    const pendingVotesCount = unreadNotifications.filter((n) => n.type === "governance_alert").length;

    return {
      mentionsCount,
      pendingVotesCount,
      totalUnread: unreadNotifications.length
    };
  }
})
