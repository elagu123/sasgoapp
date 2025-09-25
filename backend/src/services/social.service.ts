import { CacheService } from './cache.service';
import { LoggingService } from './logging.service';
import { MetricsService } from './metrics.service';
import { PrismaClient } from '@prisma/client';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  location?: string;
  avatar?: string;
  coverPhoto?: string;
  interests: string[];
  travelStyle: 'budget' | 'luxury' | 'adventure' | 'family' | 'business' | 'solo';
  isPublic: boolean;
  verificationStatus: 'none' | 'email' | 'phone' | 'verified';
  joinedDate: Date;
  stats: {
    tripsCount: number;
    countriesVisited: number;
    totalDistance: number;
    followersCount: number;
    followingCount: number;
    likesReceived: number;
  };
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
}

export interface TripPost {
  id: string;
  userId: string;
  tripId: string;
  title: string;
  description: string;
  images: string[];
  location: {
    name: string;
    coordinates?: { lat: number; lng: number };
    country: string;
  };
  tags: string[];
  visibility: 'public' | 'followers' | 'private';
  likes: number;
  comments: number;
  shares: number;
  createdAt: Date;
  updatedAt: Date;
  isHighlight: boolean;
  travelDates: {
    start: Date;
    end: Date;
  };
  expenses?: {
    total: number;
    currency: string;
    breakdown?: { category: string; amount: number }[];
  };
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  likes: number;
  replies: Comment[];
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
  notificationsEnabled: boolean;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  category: 'destination' | 'interest' | 'style' | 'general';
  image?: string;
  banner?: string;
  isPublic: boolean;
  memberCount: number;
  postCount: number;
  createdBy: string;
  moderators: string[];
  rules: string[];
  tags: string[];
  location?: {
    name: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityMembership {
  id: string;
  userId: string;
  communityId: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: Date;
  notificationsEnabled: boolean;
  isActive: boolean;
}

export interface TravelRecommendation {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: 'destination' | 'activity' | 'restaurant' | 'accommodation';
  title: string;
  description: string;
  location: string;
  images?: string[];
  rating?: number;
  priceRange?: 'budget' | 'mid' | 'luxury';
  categories: string[];
  personalNote?: string;
  createdAt: Date;
  status: 'pending' | 'viewed' | 'saved' | 'completed';
}

export interface SocialNotification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'recommendation' | 'community_invite';
  fromUserId: string;
  relatedId: string; // postId, commentId, etc.
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export class SocialService {
  private cache: CacheService;
  private logger: LoggingService;
  private metrics: MetricsService;
  private prisma: PrismaClient;

  constructor() {
    this.cache = new CacheService();
    this.logger = new LoggingService();
    this.metrics = new MetricsService();
    this.prisma = new PrismaClient();
  }

  // User Profile Management
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const cacheKey = `profile:${userId}`;
    const cached = await this.cache.get<UserProfile>(cacheKey);
    
    if (cached) {
      this.metrics.incrementCounter('social_cache_hits');
      return cached;
    }

    try {
      // Fetch from database
      const profile = await this.fetchUserProfileFromDB(userId);
      
      if (profile) {
        // Cache for 30 minutes
        await this.cache.set(cacheKey, profile, 1800);
      }
      
      return profile;
    } catch (error) {
      this.logger.error(`Failed to fetch user profile for ${userId}:`, error as Error);
      return null;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      // Update in database
      const updatedProfile = await this.updateUserProfileInDB(userId, updates);
      
      // Invalidate cache
      await this.cache.del(`profile:${userId}`);
      
      // Update related caches
      await this.invalidateUserRelatedCaches(userId);
      
      this.metrics.incrementCounter('social_profile_updates');
      this.logger.info('User profile updated', { userId, updates: Object.keys(updates) });
      
      return updatedProfile;
    } catch (error) {
      this.logger.error(`Failed to update user profile for ${userId}:`, error as Error);
      throw error;
    }
  }

  async searchUsers(
    query: string,
    filters: {
      location?: string;
      interests?: string[];
      travelStyle?: string;
      isVerified?: boolean;
    } = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ users: UserProfile[]; total: number; hasMore: boolean }> {
    const cacheKey = `users:search:${query}:${JSON.stringify(filters)}:${page}:${limit}`;
    const cached = await this.cache.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const results = await this.searchUsersInDB(query, filters, page, limit);
      
      // Cache for 10 minutes
      await this.cache.set(cacheKey, results, 600);
      
      this.metrics.incrementCounter('social_user_searches');
      
      return results;
    } catch (error) {
      this.logger.error(`User search failed for query ${query}:`, error as Error);
      throw error;
    }
  }

  // Posts Management
  async createPost(userId: string, postData: Omit<TripPost, 'id' | 'userId' | 'likes' | 'comments' | 'shares' | 'createdAt' | 'updatedAt'>): Promise<TripPost> {
    try {
      const post = await this.createPostInDB(userId, postData);
      
      // Invalidate related caches
      await this.invalidateUserPostsCaches(userId);
      await this.invalidateFeedCaches();
      
      // Notify followers
      await this.notifyFollowersOfNewPost(userId, post.id);
      
      this.metrics.incrementCounter('social_posts_created');
      this.logger.info('Post created', { userId, postId: post.id });
      
      return post;
    } catch (error) {
      this.logger.error(`Failed to create post for user ${userId}:`, error as Error);
      throw error;
    }
  }

  async getUserPosts(
    userId: string,
    viewerId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ posts: TripPost[]; total: number; hasMore: boolean }> {
    const cacheKey = `posts:user:${userId}:viewer:${viewerId || 'public'}:${page}:${limit}`;
    const cached = await this.cache.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const results = await this.getUserPostsFromDB(userId, viewerId, page, limit);
      
      // Cache for 5 minutes
      await this.cache.set(cacheKey, results, 300);
      
      return results;
    } catch (error) {
      this.logger.error(`Failed to fetch posts for user ${userId}:`, error as Error);
      throw error;
    }
  }

  async getFeed(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ posts: TripPost[]; total: number; hasMore: boolean }> {
    const cacheKey = `feed:${userId}:${page}:${limit}`;
    const cached = await this.cache.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Get posts from followed users and communities
      const results = await this.generateUserFeed(userId, page, limit);
      
      // Cache for 3 minutes (feeds should be relatively fresh)
      await this.cache.set(cacheKey, results, 180);
      
      this.metrics.incrementCounter('social_feed_views');
      
      return results;
    } catch (error) {
      this.logger.error(`Failed to generate feed for user ${userId}:`, error as Error);
      throw error;
    }
  }

  async likePost(userId: string, postId: string): Promise<boolean> {
    try {
      const success = await this.likePostInDB(userId, postId);
      
      if (success) {
        // Invalidate post cache
        await this.cache.del(`post:${postId}`);
        
        // Create notification
        const post = await this.getPostById(postId);
        if (post && post.userId !== userId) {
          await this.createNotification({
            userId: post.userId,
            type: 'like',
            fromUserId: userId,
            relatedId: postId,
            message: 'liked your post',
            isRead: false,
            createdAt: new Date()
          });
        }
        
        this.metrics.incrementCounter('social_post_likes');
      }
      
      return success;
    } catch (error) {
      this.logger.error(`Failed to like post ${postId}:`, error as Error);
      return false;
    }
  }

  async unlikePost(userId: string, postId: string): Promise<boolean> {
    try {
      const success = await this.unlikePostInDB(userId, postId);
      
      if (success) {
        await this.cache.del(`post:${postId}`);
        this.metrics.incrementCounter('social_post_unlikes');
      }
      
      return success;
    } catch (error) {
      this.logger.error(`Failed to unlike post ${postId}:`, error as Error);
      return false;
    }
  }

  // Comments Management
  async addComment(userId: string, postId: string, content: string, parentId?: string): Promise<Comment> {
    try {
      const comment = await this.addCommentInDB(userId, postId, content, parentId);
      
      // Invalidate post cache
      await this.cache.del(`post:${postId}`);
      await this.cache.delPattern(`comments:post:${postId}:*`);
      
      // Create notification
      const post = await this.getPostById(postId);
      if (post && post.userId !== userId) {
        await this.createNotification({
          userId: post.userId,
          type: 'comment',
          fromUserId: userId,
          relatedId: comment.id,
          message: 'commented on your post',
          isRead: false,
          createdAt: new Date()
        });
      }
      
      this.metrics.incrementCounter('social_comments_created');
      this.logger.info('Comment added', { userId, postId, commentId: comment.id });
      
      return comment;
    } catch (error) {
      this.logger.error(`Failed to add comment to post ${postId}:`, error as Error);
      throw error;
    }
  }

  async getPostComments(
    postId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ comments: Comment[]; total: number; hasMore: boolean }> {
    const cacheKey = `comments:post:${postId}:${page}:${limit}`;
    const cached = await this.cache.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const results = await this.getPostCommentsFromDB(postId, page, limit);
      
      // Cache for 5 minutes
      await this.cache.set(cacheKey, results, 300);
      
      return results;
    } catch (error) {
      this.logger.error(`Failed to fetch comments for post ${postId}:`, error as Error);
      throw error;
    }
  }

  // Follow System
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    try {
      const success = await this.followUserInDB(followerId, followingId);
      
      if (success) {
        // Invalidate related caches
        await this.invalidateFollowCaches(followerId, followingId);
        
        // Create notification
        await this.createNotification({
          userId: followingId,
          type: 'follow',
          fromUserId: followerId,
          relatedId: followerId,
          message: 'started following you',
          isRead: false,
          createdAt: new Date()
        });
        
        this.metrics.incrementCounter('social_follows');
      }
      
      return success;
    } catch (error) {
      this.logger.error(`Failed to follow user ${followingId}:`, error as Error);
      return false;
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const success = await this.unfollowUserInDB(followerId, followingId);
      
      if (success) {
        await this.invalidateFollowCaches(followerId, followingId);
        this.metrics.incrementCounter('social_unfollows');
      }
      
      return success;
    } catch (error) {
      this.logger.error(`Failed to unfollow user ${followingId}:`, error as Error);
      return false;
    }
  }

  async getFollowers(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ users: UserProfile[]; total: number; hasMore: boolean }> {
    const cacheKey = `followers:${userId}:${page}:${limit}`;
    const cached = await this.cache.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const results = await this.getFollowersFromDB(userId, page, limit);
      
      // Cache for 10 minutes
      await this.cache.set(cacheKey, results, 600);
      
      return results;
    } catch (error) {
      this.logger.error(`Failed to fetch followers for user ${userId}:`, error as Error);
      throw error;
    }
  }

  async getFollowing(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ users: UserProfile[]; total: number; hasMore: boolean }> {
    const cacheKey = `following:${userId}:${page}:${limit}`;
    const cached = await this.cache.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const results = await this.getFollowingFromDB(userId, page, limit);
      
      // Cache for 10 minutes
      await this.cache.set(cacheKey, results, 600);
      
      return results;
    } catch (error) {
      this.logger.error(`Failed to fetch following for user ${userId}:`, error as Error);
      throw error;
    }
  }

  // Communities
  async createCommunity(
    userId: string,
    communityData: Omit<Community, 'id' | 'createdBy' | 'memberCount' | 'postCount' | 'createdAt' | 'updatedAt'>
  ): Promise<Community> {
    try {
      const community = await this.createCommunityInDB(userId, communityData);
      
      // Automatically join creator as admin
      await this.joinCommunity(userId, community.id, 'admin');
      
      this.metrics.incrementCounter('social_communities_created');
      this.logger.info('Community created', { userId, communityId: community.id });
      
      return community;
    } catch (error) {
      this.logger.error(`Failed to create community for user ${userId}:`, error as Error);
      throw error;
    }
  }

  async joinCommunity(userId: string, communityId: string, role: 'member' | 'moderator' | 'admin' = 'member'): Promise<boolean> {
    try {
      const success = await this.joinCommunityInDB(userId, communityId, role);
      
      if (success) {
        // Invalidate community caches
        await this.cache.delPattern(`community:${communityId}:*`);
        await this.cache.delPattern(`user_communities:${userId}:*`);
        
        this.metrics.incrementCounter('social_community_joins');
      }
      
      return success;
    } catch (error) {
      this.logger.error(`Failed to join community ${communityId}:`, error as Error);
      return false;
    }
  }

  async getUserCommunities(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ communities: Community[]; total: number; hasMore: boolean }> {
    const cacheKey = `user_communities:${userId}:${page}:${limit}`;
    const cached = await this.cache.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const results = await this.getUserCommunitiesFromDB(userId, page, limit);
      
      // Cache for 15 minutes
      await this.cache.set(cacheKey, results, 900);
      
      return results;
    } catch (error) {
      this.logger.error(`Failed to fetch communities for user ${userId}:`, error as Error);
      throw error;
    }
  }

  // Recommendations
  async createRecommendation(
    fromUserId: string,
    toUserId: string,
    recommendationData: Omit<TravelRecommendation, 'id' | 'fromUserId' | 'toUserId' | 'createdAt' | 'status'>
  ): Promise<TravelRecommendation> {
    try {
      const recommendation = await this.createRecommendationInDB(fromUserId, toUserId, recommendationData);
      
      // Create notification
      await this.createNotification({
        userId: toUserId,
        type: 'recommendation',
        fromUserId,
        relatedId: recommendation.id,
        message: 'sent you a travel recommendation',
        isRead: false,
        createdAt: new Date()
      });
      
      this.metrics.incrementCounter('social_recommendations_created');
      
      return recommendation;
    } catch (error) {
      this.logger.error(`Failed to create recommendation from ${fromUserId} to ${toUserId}:`, error as Error);
      throw error;
    }
  }

  // Notifications
  async createNotification(notificationData: Omit<SocialNotification, 'id'>): Promise<SocialNotification> {
    try {
      const notification = await this.createNotificationInDB(notificationData);
      
      // Invalidate user notifications cache
      await this.cache.delPattern(`notifications:${notificationData.userId}:*`);
      
      return notification;
    } catch (error) {
      this.logger.error(`Failed to create notification for user ${notificationData.userId}:`, error as Error);
      throw error;
    }
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ notifications: SocialNotification[]; total: number; hasMore: boolean; unreadCount: number }> {
    const cacheKey = `notifications:${userId}:${page}:${limit}:${unreadOnly}`;
    const cached = await this.cache.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const results = await this.getUserNotificationsFromDB(userId, page, limit, unreadOnly);
      
      // Cache for 2 minutes (notifications should be fresh)
      await this.cache.set(cacheKey, results, 120);
      
      return results;
    } catch (error) {
      this.logger.error(`Failed to fetch notifications for user ${userId}:`, error as Error);
      throw error;
    }
  }

  // Private helper methods
  private async fetchUserProfileFromDB(userId: string): Promise<UserProfile | null> {
    // Mock implementation - replace with actual database query
    return null;
  }

  private async updateUserProfileInDB(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    // Mock implementation
    throw new Error('Not implemented');
  }

  private async searchUsersInDB(query: string, filters: any, page: number, limit: number): Promise<any> {
    // Mock implementation
    return { users: [], total: 0, hasMore: false };
  }

  private async createPostInDB(userId: string, postData: any): Promise<TripPost> {
    // Mock implementation
    throw new Error('Not implemented');
  }

  private async getUserPostsFromDB(userId: string, viewerId?: string, page: number = 1, limit: number = 20): Promise<any> {
    // Mock implementation
    return { posts: [], total: 0, hasMore: false };
  }

  private async generateUserFeed(userId: string, page: number, limit: number): Promise<any> {
    // Mock implementation - would fetch posts from followed users and communities
    return { posts: [], total: 0, hasMore: false };
  }

  private async getPostById(postId: string): Promise<TripPost | null> {
    // Mock implementation
    return null;
  }

  private async likePostInDB(userId: string, postId: string): Promise<boolean> {
    // Mock implementation
    return true;
  }

  private async unlikePostInDB(userId: string, postId: string): Promise<boolean> {
    // Mock implementation
    return true;
  }

  private async addCommentInDB(userId: string, postId: string, content: string, parentId?: string): Promise<Comment> {
    // Mock implementation
    throw new Error('Not implemented');
  }

  private async getPostCommentsFromDB(postId: string, page: number, limit: number): Promise<any> {
    // Mock implementation
    return { comments: [], total: 0, hasMore: false };
  }

  private async followUserInDB(followerId: string, followingId: string): Promise<boolean> {
    // Mock implementation
    return true;
  }

  private async unfollowUserInDB(followerId: string, followingId: string): Promise<boolean> {
    // Mock implementation
    return true;
  }

  private async getFollowersFromDB(userId: string, page: number, limit: number): Promise<any> {
    // Mock implementation
    return { users: [], total: 0, hasMore: false };
  }

  private async getFollowingFromDB(userId: string, page: number, limit: number): Promise<any> {
    // Mock implementation
    return { users: [], total: 0, hasMore: false };
  }

  private async createCommunityInDB(userId: string, communityData: any): Promise<Community> {
    // Mock implementation
    throw new Error('Not implemented');
  }

  private async joinCommunityInDB(userId: string, communityId: string, role: string): Promise<boolean> {
    // Mock implementation
    return true;
  }

  private async getUserCommunitiesFromDB(userId: string, page: number, limit: number): Promise<any> {
    // Mock implementation
    return { communities: [], total: 0, hasMore: false };
  }

  private async createRecommendationInDB(fromUserId: string, toUserId: string, data: any): Promise<TravelRecommendation> {
    // Mock implementation
    throw new Error('Not implemented');
  }

  private async createNotificationInDB(data: any): Promise<SocialNotification> {
    // Mock implementation
    throw new Error('Not implemented');
  }

  private async getUserNotificationsFromDB(userId: string, page: number, limit: number, unreadOnly: boolean): Promise<any> {
    // Mock implementation
    return { notifications: [], total: 0, hasMore: false, unreadCount: 0 };
  }

  private async notifyFollowersOfNewPost(userId: string, postId: string): Promise<void> {
    // Mock implementation - would notify all followers of new post
  }

  private async invalidateUserRelatedCaches(userId: string): Promise<void> {
    await this.cache.delPattern(`posts:user:${userId}:*`);
    await this.cache.delPattern(`followers:${userId}:*`);
    await this.cache.delPattern(`following:${userId}:*`);
  }

  private async invalidateUserPostsCaches(userId: string): Promise<void> {
    await this.cache.delPattern(`posts:user:${userId}:*`);
  }

  private async invalidateFeedCaches(): Promise<void> {
    await this.cache.delPattern(`feed:*`);
  }

  private async invalidateFollowCaches(followerId: string, followingId: string): Promise<void> {
    await this.cache.delPattern(`followers:${followingId}:*`);
    await this.cache.delPattern(`following:${followerId}:*`);
    await this.cache.delPattern(`feed:${followerId}:*`);
  }
}

export const socialService = new SocialService();