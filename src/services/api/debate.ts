// Suggested British Parliamentary speaking roles for the admin runsheet role
// picker. These are suggestions only — the Timer `role` field is free text.
// The backend exports the same list as `timer.models.BP_ROLES`; there is no API
// endpoint for it, so it is mirrored here.
export const BP_ROLES = [
  'Prime Minister',
  'Leader of Opposition',
  'Deputy Prime Minister',
  'Deputy Leader of Opposition',
  'Member for the Government',
  'Member for the Opposition',
  'Government Whip',
  'Opposition Whip',
] as const
