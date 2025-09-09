

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../hooks/useToast.ts';
import { useCollaboration } from '../hooks/useCollaboration.ts';
import { useTrips } from '../hooks/useTrips.ts';
import type { Trip, TripMember, Invite, Role, PrivacySetting } from '../types.ts';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
}

const MemberItem: React.FC<{ member: TripMember; onRoleChange: (memberId: string, role: Role) => void }> = ({ member, onRoleChange }) => (
    <div className="flex items-center justify-between py-2">
        <div className="flex items-center">
            <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full mr-3" />
            <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-xs text-gray-500">{member.email}</p>
            </div>
        </div>
        {member.role === 'OWNER' ? (
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Owner</span>
        ) : (
            <select
                value={member.role}
                onChange={(e) => onRoleChange(member.id, e.target.value as Role)}
                className="p-1 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500"
            >
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
            </select>
        )}
    </div>
);

const InviteItem: React.FC<{ invite: Invite }> = ({ invite }) => (
     <div className="flex items-center justify-between py-2 text-sm text-gray-500 dark:text-gray-400">
        <p>{invite.email}</p>
        <span className="italic">{invite.role} (Pendiente)</span>
    </div>
);

const PrivacyOption: React.FC<{
    value: PrivacySetting;
    current: PrivacySetting;
    icon: string;
    title: string;
    description: string;
    onChange: (value: PrivacySetting) => void;
}> = ({ value, current, icon, title, description, onChange }) => (
    <label className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${current === value ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-500' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'}`}>
        <input type="radio" name="privacy" value={value} checked={current === value} onChange={() => onChange(value)} className="sr-only" />
        <span className="text-2xl mr-3 mt-1">{icon}</span>
        <div>
            <span className="font-semibold">{title}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
    </label>
);


const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, trip }) => {
    const { addToast } = useToast();
    const { members, invites, inviteUser, updateMemberRole, isLoading } = useCollaboration(trip.id);
    const { updateTrip } = useTrips();

    const publicLink = `${window.location.origin}/#/public/trip/${trip.id}`;

    const handleInviteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const role = formData.get('role') as Role;
        inviteUser({ email, role });
        e.currentTarget.reset();
    };

    const handleRoleChange = (memberId: string, role: Role) => {
        updateMemberRole({ memberId, role });
    };

    const handlePrivacyChange = (newPrivacy: PrivacySetting) => {
        updateTrip.mutate({ id: trip.id, privacy: newPrivacy, version: trip.version });
    };
    
    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicLink);
        addToast('Enlace copiado al portapapeles', 'success');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* @ts-ignore */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    {/* @ts-ignore */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="relative bg-white dark:bg-gray-800 w-full max-w-lg rounded-lg shadow-xl flex flex-col"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Compartir Viaje</h2>
                                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
                            </div>
                        
                            <form onSubmit={handleInviteSubmit} className="flex gap-2">
                                <input 
                                    type="email" 
                                    name="email"
                                    id="email" 
                                    required 
                                    placeholder="nombre@ejemplo.com"
                                    className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" 
                                />
                                <select id="role" name="role" defaultValue="EDITOR" className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                    <option value="EDITOR">Puede editar</option>
                                    <option value="VIEWER">Solo puede ver</option>
                                </select>
                                <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                                    Invitar
                                </button>
                            </form>
                        </div>

                        <div className="border-t dark:border-gray-700 p-6 space-y-4">
                             <h3 className="font-semibold">Acceso General</h3>
                            <div className="space-y-2">
                                <PrivacyOption value="private" current={trip.privacy} icon="🔒" title="Privado" description="Solo vos y los miembros invitados pueden acceder." onChange={handlePrivacyChange} />
                                <PrivacyOption value="link" current={trip.privacy} icon="🔗" title="Con enlace" description="Cualquier persona con el enlace puede ver." onChange={handlePrivacyChange} />
                                <PrivacyOption value="public" current={trip.privacy} icon="🌍" title="Público" description="Cualquiera puede encontrar y ver este viaje." onChange={handlePrivacyChange} />
                            </div>
                            {trip.privacy !== 'private' && (
                                <div className="flex gap-2">
                                    <input type="text" readOnly value={publicLink} className="flex-grow p-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-sm" />
                                    <button onClick={handleCopyLink} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-semibold">
                                        Copiar
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="border-t dark:border-gray-700 max-h-60 overflow-y-auto p-6">
                            <h3 className="font-semibold mb-2">Miembros del Viaje</h3>
                             {isLoading ? (
                                <p className="text-sm text-gray-500">Cargando miembros...</p>
                            ) : (
                                <div className="divide-y dark:divide-gray-700">
                                    {members.map(member => (
                                        <MemberItem key={member.id} member={member} onRoleChange={handleRoleChange} />
                                    ))}
                                    {invites.map(invite => (
                                        <InviteItem key={invite.id} invite={invite} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ShareModal;