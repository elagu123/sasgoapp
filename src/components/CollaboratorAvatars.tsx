
import React from 'react';
import type { TripMember, AwareUser } from '../types.ts';

interface CollaboratorAvatarsProps {
    members: TripMember[];
    awareUsers?: AwareUser[];
    size?: 'sm' | 'md';
}

const CollaboratorAvatars: React.FC<CollaboratorAvatarsProps> = ({ members, awareUsers = [], size = 'md' }) => {
    const sizeClasses = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
    const awareUserIds = new Set(awareUsers.map(u => u.state.user?.id));
    
    return (
        <div className="flex -space-x-2 overflow-hidden">
            {members.slice(0, 3).map(m => {
                 const isAware = awareUserIds.has(m.id);
                 return (
                     <img 
                        key={m.id} 
                        className={`inline-block ${sizeClasses} rounded-full ring-2 ring-white dark:ring-gray-800 transition-all ${isAware ? 'ring-green-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-800' : ''}`} 
                        src={m.avatarUrl} 
                        alt={m.name} 
                        title={`${m.name} (${m.role})${isAware ? ' - Activo ahora' : ''}`}
                    />
                 )
            })}
            {members.length > 3 && (
                 <div className={`flex ${sizeClasses} items-center justify-center rounded-full bg-gray-200 ring-2 ring-white dark:ring-gray-800 dark:bg-gray-600 text-xs font-medium text-gray-600 dark:text-gray-200`}>
                    +{members.length - 3}
                </div>
            )}
        </div>
    );
};

export default CollaboratorAvatars;
