import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MapPin, Calendar, Users, MoreHorizontal } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

interface FeedPost {
  id: string;
  userId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    isVerified: boolean;
  };
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
  createdAt: string;
  isHighlight: boolean;
  travelDates: {
    start: string;
    end: string;
  };
  expenses?: {
    total: number;
    currency: string;
  };
  isLiked?: boolean;
  isFollowing?: boolean;
}

interface SocialFeedProps {
  feedType?: 'home' | 'following' | 'discover' | 'user';
  userId?: string;
  className?: string;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ 
  feedType = 'home', 
  userId,
  className = '' 
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Mock data for demonstration
  const mockPosts: FeedPost[] = [
    {
      id: '1',
      userId: 'user1',
      author: {
        id: 'user1',
        username: 'wanderlust_sarah',
        displayName: 'Sarah Johnson',
        avatar: 'https://i.pravatar.cc/150?u=sarah',
        isVerified: true
      },
      tripId: 'trip1',
      title: 'Amazing sunset in Santorini',
      description: 'Just witnessed the most incredible sunset from Oia! The colors were absolutely breathtaking. This island never fails to amaze me. ✨',
      images: [
        'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&h=600&fit=crop'
      ],
      location: {
        name: 'Oia, Santorini',
        country: 'Greece',
        coordinates: { lat: 36.4618, lng: 25.3753 }
      },
      tags: ['sunset', 'santorini', 'greece', 'photography'],
      visibility: 'public',
      likes: 247,
      comments: 18,
      shares: 12,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isHighlight: true,
      travelDates: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      expenses: {
        total: 1250,
        currency: 'EUR'
      },
      isLiked: false,
      isFollowing: true
    },
    {
      id: '2',
      userId: 'user2',
      author: {
        id: 'user2',
        username: 'adventure_mike',
        displayName: 'Mike Chen',
        avatar: 'https://i.pravatar.cc/150?u=mike',
        isVerified: false
      },
      tripId: 'trip2',
      title: 'Hiking the Inca Trail',
      description: 'Day 3 of the Inca Trail and my legs are definitely feeling it! But the views are worth every step. Can\'t wait to reach Machu Picchu tomorrow! 🏔️',
      images: [
        'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop'
      ],
      location: {
        name: 'Inca Trail, Cusco',
        country: 'Peru',
        coordinates: { lat: -13.1631, lng: -72.5450 }
      },
      tags: ['hiking', 'incatrail', 'peru', 'adventure'],
      visibility: 'public',
      likes: 89,
      comments: 7,
      shares: 3,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      isHighlight: false,
      travelDates: {
        start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      isLiked: true,
      isFollowing: false
    },
    {
      id: '3',
      userId: 'user3',
      author: {
        id: 'user3',
        username: 'foodie_travels',
        displayName: 'Emma Rodriguez',
        avatar: 'https://i.pravatar.cc/150?u=emma',
        isVerified: true
      },
      tripId: 'trip3',
      title: 'Street food paradise in Bangkok',
      description: 'Found this incredible street food market in Bangkok! The pad thai here is life-changing 🍜 Already planning my next food tour!',
      images: [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=800&h=600&fit=crop'
      ],
      location: {
        name: 'Chatuchak Market, Bangkok',
        country: 'Thailand',
        coordinates: { lat: 13.7997, lng: 100.5510 }
      },
      tags: ['foodie', 'bangkok', 'thailand', 'streetfood'],
      visibility: 'public',
      likes: 156,
      comments: 23,
      shares: 8,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      isHighlight: true,
      travelDates: {
        start: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      expenses: {
        total: 45,
        currency: 'USD'
      },
      isLiked: false,
      isFollowing: true
    }
  ];

  useEffect(() => {
    loadPosts();
  }, [feedType, userId]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPosts(mockPosts);
      setHasMore(false);
    } catch (error) {
      addToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              isLiked: !post.isLiked 
            }
          : post
      ));
      
      // API call would go here
      addToast(posts.find(p => p.id === postId)?.isLiked ? 'Post unliked' : 'Post liked', 'success');
    } catch (error) {
      addToast('Failed to update like', 'error');
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      setPosts(prev => prev.map(post => 
        post.userId === userId 
          ? { ...post, isFollowing: !post.isFollowing }
          : post
      ));
      
      addToast(posts.find(p => p.userId === userId)?.isFollowing ? 'Unfollowed' : 'Following', 'success');
    } catch (error) {
      addToast('Failed to update follow status', 'error');
    }
  };

  const handleShare = async (postId: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this travel post',
          url: `${window.location.origin}/social/post/${postId}`
        });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/social/post/${postId}`);
        addToast('Link copied to clipboard', 'success');
      }
    } catch (error) {
      addToast('Failed to share post', 'error');
    }
  };

  const PostCard: React.FC<{ post: FeedPost }> = ({ post }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={post.author.avatar}
            alt={post.author.displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-gray-900">{post.author.displayName}</span>
              {post.author.isVerified && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>@{post.author.username}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!post.isFollowing && post.userId !== user?.id && (
            <button
              onClick={() => handleFollow(post.userId)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700"
            >
              Follow
            </button>
          )}
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Location */}
      <div className="px-4 pb-2">
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{post.location.name}, {post.location.country}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <h3 className="font-semibold text-lg text-gray-900 mb-2">{post.title}</h3>
        <p className="text-gray-700 leading-relaxed">{post.description}</p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {post.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Images */}
      {post.images.length > 0 && (
        <div className={`${
          post.images.length === 1 
            ? 'aspect-video' 
            : 'grid grid-cols-2 gap-1 aspect-square'
        }`}>
          {post.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${post.title} ${index + 1}`}
              className="w-full h-full object-cover"
            />
          ))}
        </div>
      )}

      {/* Trip Info */}
      <div className="px-4 py-3 bg-gray-50 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(post.travelDates.start), 'MMM d')} - {format(new Date(post.travelDates.end), 'MMM d, yyyy')}
              </span>
            </div>
            {post.expenses && (
              <div className="flex items-center space-x-1">
                <span>Budget: {post.expenses.total} {post.expenses.currency}</span>
              </div>
            )}
          </div>
          {post.isHighlight && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              Highlight
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => handleLike(post.id)}
              className={`flex items-center space-x-1 ${
                post.isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{post.likes}</span>
            </button>
            
            <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{post.comments}</span>
            </button>
            
            <button
              onClick={() => handleShare(post.id)}
              className="flex items-center space-x-1 text-gray-600 hover:text-green-600"
            >
              <Share2 className="h-5 w-5" />
              <span className="text-sm font-medium">{post.shares}</span>
            </button>
          </div>
          
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View Trip
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
            <div className="aspect-video bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
      
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadPosts}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Load More Posts
          </button>
        </div>
      )}
      
      {posts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-600">
            {feedType === 'following' 
              ? 'Follow some travelers to see their adventures here!'
              : 'Be the first to share your travel story!'
            }
          </p>
        </div>
      )}
    </div>
  );
};