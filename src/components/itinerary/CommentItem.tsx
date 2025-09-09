
import React from 'react';
import type { Comment } from '../../types.ts';

const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
    return "justo ahora";
};

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
    return (
        <div className="flex items-start gap-3">
            <img src={comment.authorAvatar} alt={comment.authorName} className="w-8 h-8 rounded-full" />
            <div>
                <div className="flex items-baseline gap-2">
                    <p className="font-semibold text-sm">{comment.authorName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(comment.timestamp)}</p>
                </div>
                <div className="mt-1 p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{comment.content}</p>
                </div>
            </div>
        </div>
    );
};

export default CommentItem;
