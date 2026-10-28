import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };

export default function Teams() {
  const resource = useApiResource<{ teams: Team[] }>('/api/teams');
  return <CapabilityCard title="Teams" description="Manage teams and members.">
    {resource.status === 'loading' && <p role="status">Loading teams...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load teams: {resource.message}</p>}
    {resource.status === 'success' && (resource.data.teams.length === 0
      ? <p>No teams yet.</p>
      : <ul>{resource.data.teams.map((team, index) => <li key={team._id ?? `${team.name}-${index}`}>
        {team.name}{team.mascot ? ` (${team.mascot})` : ''} - {team.members.length} members
      </li>)}</ul>)}
  </CapabilityCard>;
}
