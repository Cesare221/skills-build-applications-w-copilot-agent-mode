import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };

export default function Activities() {
  const resource = useApiResource<{ activities: Activity[] }>('/api/activities');
  return <CapabilityCard title="Activities" description="Track student activity minutes and points.">
    {resource.status === 'loading' && <p role="status">Loading activities...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load activities: {resource.message}</p>}
    {resource.status === 'success' && (resource.data.activities.length === 0
      ? <p>No activities yet.</p>
      : <ul>{resource.data.activities.map((activity, index) => <li key={activity._id ?? `${activity.type}-${activity.minutes}-${index}`}>
        {activity.type}: {activity.minutes} minutes, {activity.points} points
      </li>)}</ul>)}
  </CapabilityCard>;
}
