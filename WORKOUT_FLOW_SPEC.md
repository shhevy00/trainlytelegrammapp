Product: Trainly / “Тренерский дневник”  
Screen group: Workout flow  
Platform: Telegram Mini App / mobile web app

## 1. Core principle

Workout logging must be faster than paper notes.

The coach works in the gym, often with one hand, between sets.

The workout logger must be:
- fast;
- compact;
- readable;
- forgiving;
- safe against data loss;
- focused on recording real workout data.

Do not build a desktop-style form.
Do not build a CRM screen.
Do not build a full-screen AI chat.
Do not make the workout flow slower than a notebook.

---

## 2. Main UX decision

The main workout logger is **list-first**, not wizard-first.

The coach should see the whole workout as a scrollable list of exercise cards.

A one-exercise-per-screen wizard is not the default mode.

Structure sheet is secondary.

---

## 3. Workout states

Workout states:

- `not_started`
- `draft`
- `in_progress`
- `completed`
- `completed_as_note`
- `cancelled`

### not_started

Workout has not started yet.

Can exist as:
- schedule item;
- template;
- planned workout;
- repeat source.

### draft

Workout instance exists and has meaningful changes.

Draft can be restored later.

### in_progress

Active workout session.

Logger is open or workout timer/session is active.

### completed

Full workout saved to journal with at least one filled set.

Updates:
- journal;
- client history;
- exercise progress;
- remaining sessions;
- schedule item if linked;
- overview;
- Client Pulse facts.

### completed_as_note

Workout/contact saved as note without full set logging.

Does not update training progress.

### cancelled

Workout was cancelled.

Does not update progress.
Does not spend paid session.

---

## 4. Start sources

Workout can start from:

1. Client profile
2. Schedule
3. Journal repeat
4. Template
5. Central plus
6. Draft recovery

### Client profile

Actions:
- Start workout
- Repeat previous
- Choose template
- Empty workout

### Schedule

Schedule item opens pre-start with client and planned context.

### Journal repeat

“Repeat this workout” creates new draft from selected historical workout.

Pre-start may be skipped.

### Template

Creates draft from template.

### Central plus

User chooses:
- existing client;
- client + workout;
- empty/new workout flow.

### Draft recovery

Unfinished draft can be continued from Overview or client profile.

---

## 5. Pre-start screen

Purpose: confirm client and choose workout source before entering logger.

Show:
- client;
- planned workout if exists;
- “What to remember” block;
- remaining sessions;
- last workout;
- limitation warnings;
- main actions.

Actions:

- Start planned
- Repeat previous
- Choose template
- Empty workout

Example:

```text
Anna Sokolova
Today: Legs · 18:00

What to remember:
Knee — avoid aggressive lunges
1 session left
Last time: leg press 110×10

[Start planned]
[Repeat previous]
[Choose template]
[Empty workout]
````

### If starting from journal repeat

When user taps “Repeat this workout” from workout detail:

* create new draft immediately;
* copy workout structure;
* open logger;
* pre-start may be skipped.

### If client has 0 sessions

Do not block workout start.

Show warning:

```text
This client has 0 paid sessions.
You can run the workout as debt or add payment now.

[Run as debt]
[Add payment]
```

If user chooses “Run as debt”, workout can continue and remaining sessions may become negative after completion.

---

## 6. Main logger layout

The workout logger is a scrollable list of exercise cards.

Show:

* client name;
* workout title;
* elapsed time;
* draft/autosave status;
* compact “What to remember” block;
* exercise cards;
* add exercise button;
* sticky bottom actions.

Example:

```text
Anna Sokolova
Legs · 18:04 · Saving

What to remember:
Knee · 1 session left · Last workout 2 days ago

Leg press
Previous: 110×10 · 110×8
Best: 120×8

1  [112.5 kg] [8 reps] [✓]
2  [kg]       [reps]   [ ]
+ Set

[History] [Comment] [More]

Leg curl
Previous: 45×12 · 45×10

1  [kg] [reps] [ ]
+ Set

+ Exercise

Sticky bottom:
[Structure] [Finish]
```

Sticky actions:

* Structure
* Finish

Do not show:

* prefilled `0 kg`;
* fake `0 kg` volume;
* huge analytics;
* one-exercise wizard as default;
* AI chat;
* video library;
* nutrition;
* marketplace.

---

## 7. Exercise card

Each exercise card contains:

* exercise name;
* previous result;
* best result optional;
* set rows;
* add set button;
* history button;
* comment button/block;
* more actions.

### Required actions

* Add set
* Open history
* Add/edit comment
* Change set type
* Add drop set
* Skip exercise
* Delete exercise from current workout
* Replace exercise

### Previous result block

Show last result for this client and exercise.

Example:

```text
Previous:
110×10 · 110×8

Best:
120×8
```

If no history:

```text
First time
```

Previous result is reference only.
It is not saved as current workout data.

---

## 8. Set row

A set row contains:

* set number;
* set type;
* weight input;
* reps input;
* duration input for time-based sets;
* optional comment;
* done status.

Basic row:

```text
1  [kg] [reps] [✓]
```

Time-based row:

```text
1  [sec] [comment] [✓]
```

Rules:

* never prefill `0`;
* use placeholders: `kg`, `reps`, `sec`;
* empty placeholder rows do not count as filled;
* created empty rows do not affect progress;
* set type alone does not make set filled.

---

## 9. Filled set rules

A set is filled if it has at least one of:

* weight + reps;
* reps without weight;
* duration/time;
* weight + duration/time;
* comment + done.

A set is not filled if it has only:

* empty row;
* placeholder values;
* set type;
* created row without meaningful data.

### Volume rules

Volume is calculated only from valid sets with:

```text
weight × reps
```

Workout volume:

```text
sum(weight × reps) across valid filled sets
```

If no valid weight × reps sets exist, show:

```text
Volume not calculated
```

Never show fake:

```text
0 kg
```

as workout volume.

---

## 10. Set types

MVP set types:

* working
* warmup
* drop
* failure
* amrap
* time

UI labels:

* Working
* Warm-up
* Drop
* Failure
* AMRAP
* Time

Set type can be changed by:

* tapping set number;
* More → Set type.

Advanced fields such as RPE/RIR are later unless already implemented simply under More.

---

## 11. Drop sets

Drop set belongs to parent set.

Do not create drop set as separate exercise.

Example:

```text
3  120 kg × 8
   ↳ Drop 100 kg × 8
   ↳ Drop 80 kg × 10
```

Rules:

* drop rows are visually nested;
* drop rows count as filled sets if they contain valid data;
* drop rows count in volume if they have weight × reps;
* deleting parent set asks what to do with drop rows.

---

## 12. Supersets

MVP superset is a visual group of exercises.

Example:

```text
Superset A

A1 Dumbbell press
A2 Fly
```

Rules:

* group exercises visually;
* show order clearly;
* do not claim complex round logic unless implemented;
* each exercise still has its own set rows;
* group can be moved in structure sheet.

Later:

* round-based logging;
* smart jump between exercises;
* rest after round.

---

## 13. Exercise history sheet

Opened from exercise card.

Show:

* last performance;
* best result;
* last 3 performances;
* last comment;
* action to insert previous values;
* action to open past workout.

Example:

```text
History: Leg press

Last time:
110×10
110×8
100×12

Best:
120×8

Last 3:
May 11 — 110×10
May 6 — 107.5×10
May 1 — 105×12

Last comment:
Knee ok, avoid aggressive lunges.

[Insert previous values]
[Open workout]
```

### Insert previous values

Previous values are not inserted automatically when repeating workout.

The coach can explicitly tap:

```text
Insert previous values
```

Only then old values are copied into current set rows.

---

## 14. Structure sheet

Structure sheet is secondary.

It does not replace main list logger.

Show:

* all exercises;
* exercise statuses;
* filled set count;
* superset groups;
* skipped exercises;
* add exercise;
* add superset;
* add note.

Example:

```text
Workout structure

1. Leg press
   2 filled sets · In progress

2. Leg curl
   Not started

3. Lunges
   Skipped

+ Exercise
+ Superset
+ Note
```

Actions:

* jump to exercise;
* reorder exercise;
* reorder group;
* skip exercise;
* add exercise;
* add superset;
* add note.

Rules:

* reordering must not lose data;
* moving exercise with filled sets is allowed;
* deleting exercise with filled sets requires confirmation.

---

## 15. Add exercise sheet

Show:

* search;
* recent client exercises;
* coach favorites;
* custom exercise;
* insert position.

Example:

```text
Add exercise

Search

Recent for this client:
Leg press
Leg curl

Coach favorites:
Squat
Lat pulldown

[Create custom exercise]
```

After selecting exercise, ask:

* insert before current;
* insert after current;
* insert at end;
* add to superset.

Do not show:

* full program builder;
* marketplace;
* long exercise descriptions;
* video library as core MVP.

---

## 16. Draft behavior

Draft starts on first meaningful change.

Meaningful changes:

* filled set data added;
* weight/reps/time/comment changed;
* exercise added;
* exercise deleted;
* exercise reordered;
* comment added;
* set type changed on filled set;
* workout title changed.

Draft must autosave.

Show status:

* Saving
* Saved
* Offline/local draft
* Save failed

Draft can be restored later.

Overview must show unfinished draft if exists.

---

## 17. Safe exit

If no meaningful changes exist:

* allow exit without confirmation.

If meaningful changes exist, show:

```text
Save workout?

There is logged data in this workout.
Save draft so you can return later.

[Save draft]
[Exit without saving]
[Cancel]
```

Rules:

* closing Mini App should not silently lose data;
* browser back should trigger safe exit;
* explicit delete draft requires confirmation.

---

## 18. Completion validation

Workout can be completed if it has at least 1 filled set.

Empty exercises do not block completion.

If there are empty exercises, show warning:

```text
Some exercises have no sets.
Save workout anyway?

[Save workout]
[Return]
```

If there are 0 filled sets, show:

```text
No filled sets

You can return and add data,
or save this session as a note.

[Return]
[Save as note]
```

Never silently complete an empty workout.

---

## 19. Finish confirmation

Show before saving completed workout:

* exercise count;
* filled set count;
* duration;
* session note;
* remaining sessions after completion;
* payment warning if needed.

Example:

```text
Finish workout?

4 exercises
12 filled sets
52 min

Session note:
[text]

After completion: 1 session left

[Save to journal]
[Return]
```

If client has 0 sessions and coach chose debt:

```text
After completion: -1 sessions
Payment state: debt
```

---

## 20. completed_as_note

`completed_as_note` is for real contact/session without full set logging.

Consequences:

* creates journal entry;
* appears in client history;
* does not spend paid session;
* does not update training progress;
* does not create records;
* does not calculate volume;
* does not show `0 kg`;
* is displayed as “Note”, not full workout.

Example:

```text
Session saved as note.
No sets were logged.
```

---

## 21. Summary

Shown after completed workout.

Show:

* client;
* workout title;
* duration;
* exercise count;
* filled set count;
* volume or “Volume not calculated”;
* notable progress;
* session note;
* AI summary block;
* Telegram draft.

Example:

```text
Done

Anna Sokolova
Legs · 52 min

4 exercises
12 sets
8 420 kg volume
1 best result

Main:
Leg press: 112.5×8, +2.5 kg vs previous.
Knee: no complaints.

Message:
Anna, today we worked well on legs...

[Copy message]
[Make shorter]
[Softer]
[Open detail]
[Client profile]
[New workout]
```

If volume cannot be calculated:

```text
Volume not calculated
```

If completed_as_note:

```text
Session saved as note.
Sets were not logged.
```

---

## 22. Journal detail

Route:

```text
/workouts/[workoutId]
```

Shows:

* client;
* date/time;
* duration;
* status;
* source;
* exercises;
* sets;
* weights;
* reps;
* time-based sets;
* drop sets;
* supersets;
* comments;
* summary;
* AI draft if exists.

Actions:

* Repeat this workout
* Edit
* Copy message
* Save as template
* Open client

Journal detail must show real workout data, not only aggregate stats.

---

## 23. Repeat workout rules

Repeating workout always creates a new workout.

Copy:

* exercises;
* exercise order;
* supersets;
* drop set structure;
* number of set rows;
* set types.

Do not copy as new completed data:

* previous weights;
* previous reps;
* previous set comments.

Previous values must be shown only as previous/reference.

User can explicitly tap:

```text
Insert previous values
```

Only then values are inserted into current workout.

Reason:
Avoid accidentally saving old workout data as new progress.

---

## 24. Edit completed workout

MVP allows editing:

* date/time;
* title;
* exercises;
* sets;
* comments.

MVP does not allow changing client.

After editing:

* recalculate summary;
* recalculate volume;
* recalculate progress;
* update journal detail;
* do not spend paid session twice;
* preserve link to schedule item if exists.

If edit removes all filled sets, ask whether to convert to note.

---

## 25. Schedule link

Core model:

```text
schedule item = plan
workout = fact
```

Rules:

* schedule item can exist without workout;
* workout can exist without schedule item;
* completed workout can be linked to schedule item;
* linked completed workout makes schedule item completed;
* missed schedule item does not spend paid session;
* cancelled schedule item does not spend paid session.

If workout happens near existing planned slot, offer:

```text
Link this workout to planned session?

[Link]
[Keep separate]
```

---

## 26. Paid session spending

Only completed workout spends paid session.

Rules:

* completed workout → spend 1 session;
* completed_as_note → spend 0;
* draft → spend 0;
* cancelled → spend 0;
* missed schedule item → spend 0.

If remaining sessions are 0 and coach runs as debt:

* after completion remainingSessions becomes negative;
* payment state becomes debt.

---

## 27. AI inside workout flow

AI is contextual only.

AI appears in:

* pre-workout “What to remember”;
* optional exercise insight;
* post-workout summary;
* Telegram message draft.

AI must not be a chat inside logger.

Rule-based facts appear before AI generation.

OpenAI generation happens only by explicit action.

AI must never invent workout data.

---

## 28. Empty states

### No exercises

```text
No exercises in this workout yet.

[Add exercise]
[Repeat previous]
[Choose template]
```

### No previous result

```text
First time
```

### No exercise history

```text
First time doing this exercise.
History will appear after workout.
```

### No filled sets on finish

```text
No filled sets

[Return]
[Save as note]
```

### Save failed

```text
Could not save workout.
Check connection and try again.

[Retry]
[Save local draft]
```

---

## 29. Acceptance criteria

Workout flow is acceptable when:

1. Coach can start workout from client, schedule, journal repeat, template, and plus.
2. Main logger is list-first.
3. Coach sees previous result inside each exercise card.
4. Coach can add set quickly.
5. Empty set rows do not count as filled.
6. App never shows fake `0 kg` volume.
7. Coach cannot silently lose draft.
8. Workout can be completed with at least 1 filled set.
9. Empty workout cannot be silently completed.
10. completed_as_note has separate consequences.
11. Completed workout appears in journal.
12. Journal detail can be opened.
13. Specific workout can be repeated.
14. Repeat workout does not accidentally save old weights/reps as new data.
15. Paid session is spent only on completed workout.
16. Schedule item and workout fact are linked correctly.
17. AI is contextual and never a main chat.

```

