import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTripMembers, inviteUser, updateMemberRole, removeMember, cancelInvitation } from '../services/api.ts';
import type { Role } from '../types.ts';
import { useToast } from './useToast.ts';
import { MEMBERS_QUERY_KEY } from '../queryKeys.ts';

export const useCollaboration = (tripId: string) => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const { data, isLoading, error } = useQuery({
        queryKey: [MEMBERS_QUERY_KEY, tripId],
        queryFn: () => getTripMembers(tripId),
        enabled: !!tripId,
    });

    const invite = useMutation({
        mutationFn: ({ email, role }: { email: string, role: Role }) => inviteUser(tripId, email, role),
        onSuccess: () => {
            addToast('Invitación enviada.', 'success');
            queryClient.invalidateQueries({ queryKey: [MEMBERS_QUERY_KEY, tripId] });
        },
        onError: () => {
            addToast('Error al enviar la invitación.', 'error');
        }
    });

    const updateRole = useMutation({
        mutationFn: ({ memberId, role }: { memberId: string, role: Role }) => updateMemberRole(tripId, memberId, role),
        onSuccess: () => {
            addToast('Rol actualizado.', 'success');
            queryClient.invalidateQueries({ queryKey: [MEMBERS_QUERY_KEY, tripId] });
        },
        onError: () => {
            addToast('Error al actualizar el rol.', 'error');
        }
    });

    const remove = useMutation({
        mutationFn: (memberId: string) => removeMember(tripId, memberId),
        onSuccess: () => {
            addToast('Miembro removido.', 'success');
            queryClient.invalidateQueries({ queryKey: [MEMBERS_QUERY_KEY, tripId] });
        },
        onError: () => {
            addToast('Error al remover el miembro.', 'error');
        }
    });

    const cancel = useMutation({
        mutationFn: (invitationId: string) => cancelInvitation(invitationId),
        onSuccess: () => {
            addToast('Invitación cancelada.', 'success');
            queryClient.invalidateQueries({ queryKey: [MEMBERS_QUERY_KEY, tripId] });
        },
        onError: () => {
            addToast('Error al cancelar la invitación.', 'error');
        }
    });

    return {
        members: data?.members ?? [],
        invites: data?.invites ?? [],
        isLoading,
        error,
        inviteUser: invite.mutate,
        updateMemberRole: updateRole.mutate,
        removeMember: remove.mutate,
        cancelInvitation: cancel.mutate
    };
};