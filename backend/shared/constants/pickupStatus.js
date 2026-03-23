const pickupStatus = Object.freeze({
  REQUESTED:                  'requested',
  ASSIGNED:                   'assigned',
  IN_PROGRESS:                'in_progress',
  COMPLETED:                  'completed',
  FAILED:                     'failed',
  CANCELLED:                  'cancelled',
  UNASSIGNED_NO_AVAILABILITY: 'unassigned_no_availability',
});

const PICKUP_VALID_TRANSITIONS = Object.freeze({
  requested:                  ['assigned', 'unassigned_no_availability', 'cancelled'],
  assigned:                   ['in_progress', 'failed', 'cancelled'],
  in_progress:                ['completed', 'failed'],
  failed:                     ['assigned', 'cancelled'],
  unassigned_no_availability: ['assigned', 'cancelled'],
  completed:                  [],
  cancelled:                  [],
});

const PICKUP_TERMINAL_STATES = Object.freeze(new Set(['completed', 'cancelled']));

const PICKUP_ACTIVE_STATES = Object.freeze(
  new Set(['requested', 'assigned', 'in_progress', 'unassigned_no_availability'])
);

module.exports = { pickupStatus, PICKUP_VALID_TRANSITIONS, PICKUP_TERMINAL_STATES, PICKUP_ACTIVE_STATES };
