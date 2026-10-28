import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';
import { getJson } from '../api/client.js';

type Workout = { _id?: string; title: string; focus: string; minutes: number; difficulty: string; reason: string };

export default function Workouts() {
  const path = `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`;
  const resource = useApiResource(path, getJson<{ suggestions: Workout[] }>);
  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
    {resource.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load workout suggestions: {resource.message}</p>}
    {resource.status === 'success' && (resource.data.suggestions.length === 0
      ? <p>No workout suggestions available.</p>
      : <ul>{resource.data.suggestions.map((workout, index) => <li key={workout._id ?? `${workout.title}-${index}`}>
        <strong>{workout.title}</strong> - {workout.focus}, {workout.minutes} minutes, {workout.difficulty}. {workout.reason}
      </li>)}</ul>)}
  </CapabilityCard>;
}
