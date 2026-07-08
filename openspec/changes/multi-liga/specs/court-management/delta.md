# Delta for Court Management

## Unchanged

Courts remain global. No league isolation is applied to courts. All admins across all leagues see the same court list. Court CRUD operations are unchanged.

(Reason: Courts model physical venues shared across leagues. Adding per-league courts is a future concern per the proposal's out-of-scope list.)

### Requirement: Court CRUD

No changes to existing requirements or scenarios. Courts are visible to all admins regardless of league.

### Requirement: No double-booking

No changes. Court conflict validation remains global — a match scheduled on a court blocks any other match on the same court at the same time, regardless of league.
