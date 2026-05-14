Product: Trainly / “Тренерский дневник”  
Platform: Telegram Mini App / mobile web app  
Audience: offline personal fitness coaches

## 1. Core product idea

Trainly is a fast trainer diary inside Telegram.

It helps the coach manage:

- clients;
- workouts;
- paid sessions;
- schedule;
- journal;
- notes;
- contextual AI helper.

Trainly is not:

- a client app;
- a marketplace;
- a gym CRM;
- an AI trainer replacing the coach;
- a nutrition/social platform.

The main product promise:

```text
The coach stops remembering weights, payments, missed sessions, and client context in their head.
````

---

## 2. Main product cycles

### Client cycle

```text
Client → start workout → log workout → finish → journal → repeat
```

### Schedule cycle

```text
Schedule item → start planned session → complete workout → schedule item becomes completed
```

### Payment cycle

```text
Add payment → remaining sessions update → payment warning disappears
```

### Inactive client cycle

```text
Inactive client → generate/write message → schedule next workout
```

### Exercise history cycle

```text
Exercise history → previous result visible → coach repeats or increases load
```

### Quick note cycle

```text
Quick note → Client Pulse / pre-workout hints / attention items
```

### Draft recovery cycle

```text
Coach exits workout → draft saved → Overview shows unfinished draft → continue / save as note / delete
```

---

## 3. Main entities

### Client

A person trained by the coach.

Contains:

* name;
* goal;
* limitations;
* notes;
* remaining sessions;
* payment state;
* last workout;
* next workout;
* status;
* history.

### Workout

A completed or in-progress training fact.

Contains:

* client;
* date/time;
* source;
* status;
* exercises;
* sets;
* comments;
* summary;
* optional scheduleItemId.

### Schedule item

A planned session.

Important:

```text
schedule item = plan
workout = fact
```

They are related but not the same entity.

### Payment

A record that adds paid sessions.

### Note

A quick memory item that can affect future hints.

### AI generation

A generated text based on selected rule-based facts.

AI is not a separate entity the user manages directly.

---

## 4. Overview flow

Overview is the daily operational center.

It shows:

* today’s progress;
* next workout;
* unfinished draft;
* upcoming sessions;
* payment warnings;
* attention items.

### Flow

```text
Open app
→ Overview
→ see next useful action
→ start workout / continue draft / message client / add payment / schedule
```

### Attention items

Show when:

* remainingSessions <= 1;
* remainingSessions == 0;
* client inactive 10+ days;
* no next workout;
* limitation relevant today;
* no measurements for 14+ days;
* unfinished draft exists.

Do not show decorative metrics that do not lead to action.

---

## 5. Client flow

### From Clients list

```text
Open Clients
→ find client
→ see recommended action
→ act
```

Recommended action rules:

* workout today → Start
* remaining sessions <= 1 → Remind
* inactive 10+ days → Message
* no next workout → Schedule
* no workouts yet → First workout
* otherwise → Open

### From client profile

Client profile shows scenario-based top block:

* workout today;
* inactive;
* no next workout;
* zero sessions;
* normal state.

Primary actions:

* Start workout
* Repeat previous
* Schedule
* Add payment
* Add note
* Message client

---

## 6. Workout by schedule

### Start state

Coach has planned schedule item.

### Flow

```text
Schedule
→ tap session
→ pre-start
→ start planned
→ workout logger
→ finish
→ save to journal
→ schedule item becomes completed
```

### Rules

* linked completed workout changes schedule item to completed;
* completed workout spends 1 paid session;
* schedule item without workout remains planned/upcoming/missed/cancelled;
* missed does not spend paid session;
* cancelled does not spend paid session.

---

## 7. Unscheduled workout

### Flow

```text
+
→ New workout
→ choose client
→ pre-start
→ choose source
→ logger
→ finish
→ journal
```

Sources:

* repeat previous;
* choose template;
* empty workout.

### If nearby schedule item exists

Show:

```text
Link this workout to planned session?

[Link]
[Keep separate]
```

---

## 8. Repeat workout

### Sources

* client profile;
* journal entry;
* workout detail;
* pre-start screen.

### Flow

```text
Repeat workout
→ copy structure
→ create new draft
→ open logger
→ show previous values as reference
```

### Copy

Copy:

* exercises;
* order;
* supersets;
* drop set structure;
* number of set rows;
* set types.

Do not copy as new completed data:

* old weights;
* old reps;
* old set comments.

Old values are shown as previous/reference only.

Optional action:

```text
Insert previous values
```

---

## 9. Workout completion flow

### Normal completion

Allowed when workout has at least 1 filled set.

Flow:

```text
Logger
→ Finish
→ finish confirmation
→ save to journal
→ summary
```

After completion update:

* journal;
* client last workout;
* exercise history;
* progress;
* remaining sessions;
* schedule item if linked;
* overview;
* Client Pulse facts.

### Empty exercises

Empty exercises do not block completion.

Show warning:

```text
Some exercises have no sets.
Save workout anyway?

[Save workout]
[Return]
```

### No filled sets

Do not silently complete.

Show:

```text
No filled sets

[Return]
[Save as note]
```

---

## 10. completed_as_note flow

Use when there was contact/session but no full set logging.

Flow:

```text
Logger
→ no filled sets
→ Save as note
→ journal entry
→ client history
```

Consequences:

* creates journal entry;
* appears in client history;
* does not spend paid session;
* does not update progress;
* does not create records;
* does not calculate volume;
* does not show fake 0 kg.

---

## 11. Payment flow

### Add payment

Flow:

```text
Client profile / plus / attention item
→ Add payment
→ choose client
→ enter sessions
→ optional amount/comment
→ save
```

After saving update:

* remaining sessions;
* payment state;
* client profile;
* payments tab;
* overview warnings.

### Session spending rules

* completed workout → spend 1 session;
* completed_as_note → spend 0;
* draft → spend 0;
* missed → spend 0;
* cancelled → spend 0.

### Debt

If remaining sessions are 0, do not block workout.

Show:

```text
This client has 0 paid sessions.

[Run as debt]
[Add payment]
```

If completed as debt:

```text
remainingSessions = -1
paymentState = debt
```

---

## 12. Inactive client flow

### Trigger

Client has no workouts for 10+ days.

### Flow

```text
Overview / Clients
→ inactive client item
→ open profile
→ see facts
→ generate/copy message
→ schedule next workout
```

### Rule-based facts

Show before AI:

* days since last workout;
* last workout;
* goal;
* limitation if relevant;
* no next workout.

AI may generate short message only after explicit action.

---

## 13. Quick note flow

### Flow

```text
+
→ Quick note
→ choose client optional
→ choose type
→ write text
→ save
```

Types:

* general;
* limitation;
* payment;
* progress;
* complaint.

### Effects

* limitation → Client Pulse + pre-workout hints;
* payment → Payments + attention items;
* complaint → Pulse + pre-start;
* progress → History/Progress;
* general → client notes.

A note must affect the product.
Do not make it a trash notebook.

---

## 14. Exercise history flow

### Trigger

From exercise card:

```text
History
```

### Show

* last performance;
* best result;
* last 3 performances;
* last comment;
* open past workout;
* insert previous values.

### Rules

Previous values are not inserted automatically.

User must explicitly choose:

```text
Insert previous values
```

---

## 15. Draft recovery flow

### Draft is created when

* filled set added;
* weight/reps/time/comment changed;
* exercise added;
* exercise removed;
* exercise reordered;
* workout comment added;
* title changed.

### Flow

```text
Coach exits workout
→ safe exit dialog
→ save draft
→ Overview shows unfinished draft
→ Continue / Save as note / Delete
```

### Overview draft card

```text
Unfinished workout
Anna · Legs · started 23 min ago

[Continue]
[Save as note]
[Delete]
```

Delete draft requires confirmation.

---

## 16. AI flow

AI is contextual.

It appears in:

* Client Pulse;
* pre-workout hints;
* post-workout summary;
* Telegram message draft;
* payment reminder;
* inactive client message.

Flow:

```text
data → rule-based facts → optional AI wording → user copies/edits/confirms
```

AI must not be:

* main tab;
* chat;
* generic trainer;
* medical advisor;
* source of fake facts.

---

## 17. What updates after actions

### Completed workout

Updates:

* journal;
* client profile;
* last workout;
* exercise history;
* progress;
* records;
* remaining sessions;
* schedule item if linked;
* overview;
* Client Pulse facts.

### completed_as_note

Updates:

* journal;
* client history;
* notes/contact history;
* overview.

Does not update:

* progress;
* records;
* volume;
* remaining sessions.

### Payment

Updates:

* remaining sessions;
* payment state;
* payments tab;
* client card;
* client profile;
* overview warnings.

### Schedule

Updates:

* schedule;
* client profile;
* client card;
* overview.

### Quick note

Updates:

* notes;
* Client Pulse;
* pre-workout hints;
* attention items;
* payments/progress if type relevant.

---

## 18. Global states

### No clients

```text
No clients yet.
Add your first client and run the first workout.

[New client]
[Client + workout]
```

### Access expired

Allow viewing existing data.

Restrict active work above free limits.

Do not delete user data automatically.

### AI credits exhausted

Rule-based facts continue working.

Show:

```text
AI hints are over.
Rule-based hints still work.

[Buy +100]
[Upgrade to Pro]
```

### Offline/save failed

Do not lose workout data.

Show:

```text
Could not save.
Check connection and try again.

[Retry]
[Save local draft]
```

---

## 19. Edge cases

### Client has 0 sessions

Do not block workout.

Offer:

* Run as debt
* Add payment

### Client deleted/archived during draft

Show warning and allow safe export/delete of draft.

### Workout edited after completion

Recalculate:

* summary;
* volume;
* progress;
* records.

Do not spend paid session twice.

### Schedule item cancelled after workout started

Workout can still be saved as unscheduled or linked manually.

### Repeat workout from old exercise name

Use historical workout name in old record.
Use current exercise name for new selection only if user replaces it.

### Empty workout

Cannot be completed silently.
Can be saved as note.

---

## 20. MVP acceptance criteria

MVP is acceptable when:

1. Coach can add client.
2. Coach can start workout from client.
3. Coach can start workout from schedule.
4. Coach can start workout from plus.
5. Coach can repeat workout from journal/detail.
6. Main logger is list-first.
7. Previous result is visible inside exercise card.
8. Filled set rules are consistent.
9. Empty rows do not count as progress.
10. Fake 0 kg volume is never shown.
11. Workout can be completed with at least 1 filled set.
12. Empty workout cannot be silently completed.
13. completed_as_note has separate consequences.
14. Completed workout appears in journal.
15. Journal entry opens workout detail.
16. Paid session is spent only on completed workout.
17. Schedule item and workout fact are linked correctly.
18. Payment updates remaining sessions and warnings.
19. Quick notes affect Pulse/hints/attention.
20. AI is contextual and never a main chat.

