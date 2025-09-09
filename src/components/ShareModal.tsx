

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

const MemberItem: React.FC<{ 
    member: TripMember; 
    onRoleChange: (memberId: string, role: Role) => void;
    onRemove: (memberId: string) => void;
}> = ({ member, onRoleChange, onRemove }) => (
    <div className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
        <div className="flex items-center">
            <div className="relative">
                <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full mr-3" />
                {member.role === 'OWNER' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>
                )}
            </div>
            <div>
                <p className="font-semibold text-sm">{member.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
            </div>
        </div>
        {member.role === 'OWNER' ? (
            <div className="flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    👑 Propietario
                </span>
            </div>
        ) : (
            <div className="flex items-center gap-2">
                <select
                    value={member.role}
                    onChange={(e) => onRoleChange(member.id, e.target.value as Role)}
                    className="px-2 py-1 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="EDITOR">✏️ Editor</option>
                    <option value="VIEWER">👁️ Viewer</option>
                </select>
                <button
                    onClick={() => onRemove(member.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-md transition-colors"
                    title="Remover miembro"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM5 13a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM7 16a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        )}
    </div>
);

const InviteItem: React.FC<{ 
    invite: Invite; 
    onCancel: (invitationId: string) => void;
}> = ({ invite, onCancel }) => {
    const statusColors = {
        PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };

    const statusIcons = {
        PENDING: '⏳',
        ACCEPTED: '✅',
        REJECTED: '❌',
        CANCELLED: '⚫'
    };

    const statusLabels = {
        PENDING: 'Pendiente',
        ACCEPTED: 'Aceptada',
        REJECTED: 'Rechazada',
        CANCELLED: 'Cancelada'
    };

    return (
        <div className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.243 5.757a6 6 0 10-.986 9.284 1 1 0 111.087 1.678A8 8 0 1118 10a3 3 0 01-4.8 2.401A4 4 0 1114 10a1 1 0 102 0c0-1.537-.586-3.07-1.757-4.243zM12 10a2 2 0 10-4 0 2 2 0 004 0z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <p className="font-semibold text-sm">{invite.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Invitado por {invite.invitedBy} • {new Date(invite.invitedAt).toLocaleDateString()}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[invite.status]}`}>
                    {statusIcons[invite.status]} {statusLabels[invite.status]}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {invite.role === 'EDITOR' ? '✏️ Editor' : '👁️ Viewer'}
                </span>
                {invite.status === 'PENDING' && (
                    <button
                        onClick={() => onCancel(invite.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded-md transition-colors"
                        title="Cancelar invitación"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

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
    const { members, invites, inviteUser, updateMemberRole, removeMember, cancelInvitation, isLoading } = useCollaboration(trip.id);
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

    const handleRemoveMember = (memberId: string) => {
        if (confirm('¿Estás seguro de que quieres remover este miembro del viaje?')) {
            removeMember(memberId);
        }
    };

    const handleCancelInvitation = (invitationId: string) => {
        if (confirm('¿Estás seguro de que quieres cancelar esta invitación?')) {
            cancelInvitation(invitationId);
        }
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
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">🤝 Compartir Viaje</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Invita personas para colaborar en este viaje</p>
                                </div>
                                <button 
                                    onClick={onClose} 
                                    className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        
                            <form onSubmit={handleInviteSubmit} className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📧 Invitar nueva persona</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="email" 
                                            name="email"
                                            id="email" 
                                            required 
                                            placeholder="nombre@ejemplo.com"
                                            className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                        />
                                        <select 
                                            id="role" 
                                            name="role" 
                                            defaultValue="EDITOR" 
                                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="EDITOR">✏️ Editor</option>
                                            <option value="VIEWER">👁️ Viewer</option>
                                        </select>
                                        <button 
                                            type="submit" 
                                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                                        >
                                            Invitar
                                        </button>
                                    </div>
                                </div>
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

                        <div className="border-t dark:border-gray-700 max-h-80 overflow-y-auto p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white">👥 Miembros del Viaje ({members.length})</h3>
                                {members.length > 1 && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {members.filter(m => m.role === 'EDITOR').length} editores • {members.filter(m => m.role === 'VIEWER').length} viewers
                                    </span>
                                )}
                            </div>
                             {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    <span className="ml-2 text-sm text-gray-500">Cargando miembros...</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {members.map(member => (
                                        <MemberItem key={member.id} member={member} onRoleChange={handleRoleChange} onRemove={handleRemoveMember} />
                                    ))}
                                    {invites.length > 0 && (
                                        <>
                                            <div className="border-t dark:border-gray-700 pt-3 mt-4">
                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📨 Invitaciones Pendientes</h4>
                                                {invites.map(invite => (
                                                    <InviteItem key={invite.id} invite={invite} onCancel={handleCancelInvitation} />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    {members.length === 1 && invites.length === 0 && (
                                        <div className="text-center py-6">
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                ¡Invita a otros viajeros para colaborar en este viaje!
                                            </p>
                                        </div>
                                    )}
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