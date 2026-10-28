import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';
import { getJson } from '../api/client.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const resource = useApiResource('/api/leaderboard', getJson<{ leaderboard: Entry[] }>);
  return <CapabilityCard title="Leaderboard" description="Compare team point totals.">
    {resource.status === 'loading' && <p role="status">Loading leaderboard...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load leaderboard: {resource.message}</p>}
    {resource.status === 'success' && (resource.data.leaderboard.length === 0
      ? <p>No leaderboard rankings yet.</p>
      : <ol>{resource.data.leaderboard.map((entry) => <li key={entry.rank}>
        #{entry.rank} {entry.teamName}: {entry.totalPoints} points
      </li>)}</ol>)}
  </CapabilityCard>;
}
