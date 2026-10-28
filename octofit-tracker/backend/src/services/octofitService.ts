import { Activity, Team, User, Workout } from '../models/index.js';

function clientError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1, _id: 1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw clientError('Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) throw clientError('Valid userId and teamId are required');
  if (typeof type !== 'string' || !type.trim()) throw clientError('Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw clientError('Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw clientError('User or team was not found', 404);

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw clientError('Team details are required');
  const { name, mascot } = input;
  const members = input.members ?? [];
  if (typeof name !== 'string' || !name.trim()) throw clientError('Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw clientError('Team mascot is required');
  if (!Array.isArray(members) || !members.every(isObjectId)) {
    throw clientError('Members must contain valid user IDs');
  }
  if (members.length > 0) {
    const foundMembers = await User.countDocuments({ _id: { $in: members } });
    if (foundMembers !== new Set(members).size) throw clientError('One or more members were not found', 404);
  }
  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: string; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);
  const teams = await Team.find({ _id: { $in: totals.map(({ _id }) => _id) } }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));
  return totals.flatMap(({ _id, totalPoints }, index) => {
    const teamName = teamNames.get(_id.toString());
    return teamName ? [{ teamName, totalPoints, rank: index + 1 }] : [];
  });
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw clientError('User was not found', 404);

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const activityFocus = recentActivities
    .map(({ type }) => {
      const normalizedType = type.toLowerCase();
      if (['run', 'running', 'cycle', 'cycling', 'swim', 'swimming', 'walk', 'walking'].includes(normalizedType)) return 'endurance';
      if (['strength', 'weights', 'weight training'].includes(normalizedType)) return 'strength';
      if (['yoga', 'mobility', 'stretching'].includes(normalizedType)) return 'mobility';
      return type;
    })[0];
  const availableFocuses = new Set(await Workout.distinct('focus'));
  const focus = availableFocuses.has(user.fitnessGoal)
    ? user.fitnessGoal
    : activityFocus && availableFocuses.has(activityFocus)
      ? activityFocus
      : user.fitnessGoal;
  const workouts = await Workout.find({ focus }).lean();
  return workouts.map((workout) => ({
    ...workout,
    reason: activityFocus === focus
      ? `Recommended based on your recent ${recentActivities[0]?.type ?? focus} activity.`
      : `Recommended to support your ${user.fitnessGoal} goal.`,
  }));
}

export { User };
