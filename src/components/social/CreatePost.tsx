import React, { useState } from 'react';
import { Camera, MapPin, Hash, Globe, Users, Lock, X, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

interface CreatePostProps {
  tripId?: string;
  onPostCreated?: (post: any) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export const CreatePost: React.FC<CreatePostProps> = ({
  tripId,
  onPostCreated,
  onCancel,
  isModal = false
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    visibility: 'public' as 'public' | 'followers' | 'private',
    tags: [] as string[],
    isHighlight: false
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (images.length + files.length > 5) {
      addToast('Maximum 5 images allowed', 'error');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        addToast(`${file.name} is too large (max 10MB)`, 'error');
        return false;
      }
      
      if (!file.type.startsWith('image/')) {
        addToast(`${file.name} is not an image`, 'error');
        return false;
      }
      
      return true;
    });

    setImages(prev => [...prev, ...validFiles]);
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tag = currentTag.trim().toLowerCase().replace(/\s+/g, '');
    
    if (!tag) return;
    
    if (formData.tags.includes(tag)) {
      addToast('Tag already added', 'error');
      return;
    }
    
    if (formData.tags.length >= 10) {
      addToast('Maximum 10 tags allowed', 'error');
      return;
    }

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tag]
    }));
    setCurrentTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      addToast('Please add a title', 'error');
      return;
    }
    
    if (!formData.description.trim()) {
      addToast('Please add a description', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newPost = {
        id: Date.now().toString(),
        ...formData,
        userId: user?.id,
        tripId,
        images: imagePreviews, // In real app, would upload to server first
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date().toISOString(),
        author: {
          id: user?.id,
          username: user?.name?.toLowerCase().replace(/\s+/g, '_'),
          displayName: user?.name,
          avatar: `https://i.pravatar.cc/150?u=${user?.email}`,
          isVerified: false
        }
      };

      onPostCreated?.(newPost);
      addToast('Post created successfully!', 'success');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        visibility: 'public',
        tags: [],
        isHighlight: false
      });
      setImages([]);
      setImagePreviews([]);
      
    } catch (error) {
      addToast('Failed to create post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see this post' },
    { value: 'followers', label: 'Followers', icon: Users, description: 'Only your followers can see this' },
    { value: 'private', label: 'Private', icon: Lock, description: 'Only you can see this post' }
  ];

  const content = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Create Post</h2>
        {isModal && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="flex items-center space-x-3">
        <img
          src={`https://i.pravatar.cc/150?u=${user?.email}`}
          alt={user?.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-600">@{user?.name?.toLowerCase().replace(/\s+/g, '_')}</p>
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="What's the highlight of your trip?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={100}
        />
        <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100</p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Share the story of your adventure..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={1000}
        />
        <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000</p>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Where was this taken?"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos (up to 5)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {images.length < 5 && (
            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50">
              <Camera className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Add Photo</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex items-center space-x-2 mb-3">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add a tag..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={20}
            />
          </div>
          <button
            type="button"
            onClick={addTag}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {formData.tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Who can see this post?
        </label>
        <div className="space-y-2">
          {visibilityOptions.map(option => {
            const IconComponent = option.icon;
            return (
              <label
                key={option.value}
                className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                  formData.visibility === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={option.value}
                  checked={formData.visibility === option.value}
                  onChange={(e) => handleInputChange('visibility', e.target.value)}
                  className="sr-only"
                />
                <IconComponent className="h-5 w-5 text-gray-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Highlight Option */}
      <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
        <div>
          <p className="font-medium text-gray-900">Mark as Highlight</p>
          <p className="text-sm text-gray-600">Feature this post on your profile</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isHighlight}
            onChange={(e) => handleInputChange('isHighlight', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Post'}
        </button>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {content}
    </div>
  );
};