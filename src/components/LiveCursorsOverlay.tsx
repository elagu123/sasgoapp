
import React from 'react';
import { motion } from 'framer-motion';
import type { AwareUser } from '../types';
import { useAuth } from '../contexts/AuthContext.tsx';

interface Props {
    awareUsers: AwareUser[];
}

const CursorIcon: React.FC<{ color: string }> = ({ color }) => (
    <svg
        className="w-6 h-6 -ml-1 -mt-1 transform -rotate-12"
        viewBox="0 0 24 24"
        fill={color}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M6.36364 4.54545L18 10.9091L13.0909 13.0909L10.9091 18L6.36364 4.54545Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
);


const LiveCursorsOverlay: React.FC<Props> = ({ awareUsers }) => {
    const { user } = useAuth();
    
    // Filter out the current user
    const otherUsers = awareUsers.filter(u => u.state.user?.id !== user?.id);
    
    return (
        <div className="fixed inset-0 pointer-events-none z-[999]" aria-hidden="true">
            {otherUsers.map(({ clientId, state }) => {
                if (!state.cursor) return null;

                return (
                    <motion.div
                        key={clientId}
                        data-testid={`cursor-${state.user.id}`}
                        className="absolute top-0 left-0"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1, x: state.cursor.x, y: state.cursor.y }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.1, ease: "linear" }}
                    >
                        <CursorIcon color={state.user.color || '#000000'} />
                        <span 
                            className="text-xs font-semibold px-2 py-1 rounded-full text-white shadow"
                            style={{ backgroundColor: state.user.color || '#000000' }}
                        >
                            {state.user.name}
                        </span>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default LiveCursorsOverlay;
