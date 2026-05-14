
## 1. Bottom navigation

Main bottom navigation:

- **Overview**
- **Clients**
- **+**
- **Journal**
- **Schedule**

The central **+** is required. Do not replace it with “More”.

AI is not a main tab.  
Billing/access is not a main tab.  
Billing/access belongs in profile/settings.

### Overview

Daily operational center: today, next workout, unfinished draft, upcoming sessions, payment warnings, and attention items.

### Clients

Client list, search, filters, statuses, remaining sessions, and recommended action.

### +

Central quick actions.

### Journal

History of completed workouts and notes. Every journal entry must be openable.

### Schedule

Workout planning screen: planned, upcoming, completed, missed, cancelled.

---

## 2. Central plus

The central **+** opens a bottom sheet:

- **New client**
- **Client + workout**
- **New workout**
- **Add payment**
- **Quick note**

### New client

Create a compact client profile.  
Only name is required by default. Goal, limitations, notes, Telegram, and payment details are optional/collapsed.

### Client + workout

Create or select a client and immediately start the workout flow.

### New workout

Choose existing client and start workout flow.

### Add payment

Add paid sessions to a client.

### Quick note

Create a note that can affect Client Pulse, pre-workout hints, attention items, payment warnings, or progress/history.

Do not add here:

- tariffs;
- access;
- AI chat;
- marketplace;
- program builder as a primary MVP action.

---

## 3. Overview

Purpose: daily operational center for the coach.

Overview is not a decorative dashboard.

Show:

- today’s workout progress;
- next workout;
- unfinished workout draft if exists;
- upcoming sessions;
- payment warnings;
- “What matters” attention items.

Example:

```text
Good afternoon, Alexander

Today
3 of 5 workouts completed
Next: Anna · 18:00 · Legs

[Start] [Schedule]

Unfinished workout
Elena · started 23 min ago
[Continue]

Upcoming:
18:00 Anna · Legs · 60 min
20:00 Elena · Mobility · 40 min

What matters:
Elena — 0 sessions left → Remind
Olga — inactive for 12 days → Message
Mikhail — no next session → Schedule
Anna — knee limitation, last leg press 110×10 → Open
````

Primary actions:

* start next workout;
* continue draft;
* open schedule;
* open client;
* add payment;
* schedule workout;
* generate/copy reminder message.

Do not show:

* decorative charts;
* fake BI dashboard;
* useless weekly metrics;
* AI chat as main block;
* empty graphs.

Empty state:

```text
No clients yet.
Add your first client and run the first workout.

[New client]
[Client + workout]
```

---

## 4. Clients

Purpose: working client list, not a phonebook.

Show:

* search;
* filters;
* client cards;
* status;
* remaining sessions;
* last workout;
* next workout;
* short hint;
* recommended action;
* quick menu.

Search placeholder:

```text
Search by name or goal
```

Filters:

* All
* Needs attention
* Stable
* Payment
* New
* Archived

Client card example:

```text
Anna Sokolova
Weight loss -8 kg

Stable · 2 sessions left
Last: 3 days ago
Next: today 18:00

Leg press +10 kg this month

[Start] [⋯]
```

Recommended action rules:

* workout today → **Start**
* remaining sessions <= 1 → **Remind**
* inactive 10+ days → **Message**
* no next workout → **Schedule**
* no workouts yet → **First workout**
* otherwise → **Open**

Quick menu:

* Open
* Edit
* Add payment
* Schedule
* Archive

Delete is not a quick action.
Delete belongs in dangerous client settings with confirmation.

Do not show:

* CRM pipeline;
* sales funnel;
* large admin tables;
* identical “Start” action for every client;
* delete as fast action.

---

## 5. Client profile

Purpose: private coach memory.

The profile must help the coach remember:

* what matters now;
* what happened last time;
* what to do next;
* what must not be forgotten.

Main sections:

* scenario-based top block;
* Client Pulse;
* Progress;
* History;
* Payments;
* Notes/limitations;
* Quick actions.

### Scenario-based top block

If workout is today:

```text
Anna Sokolova
Today 18:00 · Legs

2 sessions left
Limitation: knee

[Start workout]
[Repeat previous]
```

If client is inactive:

```text
Olga Kim
Inactive for 12 days

Limitation: back

[Message]
[Schedule]
```

If no next workout:

```text
No next workout scheduled

[Schedule]
```

If zero sessions:

```text
0 sessions left

[Add payment]
[Remind]
```

Tabs:

* Pulse
* Progress
* History
* Payments

Client Pulse example:

```text
Main thing:
Legs today at 18:00. Consider knee limitation.

Training context:
Last leg press: 110×10 · 110×8.
Can try 112.5×8 if feeling okay.

Money:
1 session left.

Control:
No measurements for 18 days.
```

Primary actions:

* Start workout
* Repeat previous workout
* Schedule workout
* Add payment
* Add note
* Generate/copy message

Dangerous actions:

* Archive client
* Delete client

Both require confirmation.

Do not show:

* full CRM form by default;
* medical diagnosis wording;
* fake AI insights;
* long AI paragraphs;
* social/feed elements.

---

## 6. Workout logger

Purpose: core product screen.

Workout logging must be faster than paper notes.

Main decision:

The workout logger is **list-first**, not wizard-first.

The coach sees the whole workout as a scrollable list of exercise cards.

Do not use one-exercise-per-screen wizard as default mode.

Show:

* client name;
* workout title;
* elapsed time;
* draft/autosave status;
* compact “What to remember” block;
* scrollable list of exercise cards;
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

Exercise card actions:

* Add set
* Open history
* Add comment
* More actions
* Change set type
* Add drop set
* Skip exercise
* Delete exercise from current workout

Do not show:

* prefilled `0 kg`;
* fake `0 kg` volume;
* huge analytics;
* full-screen AI chat;
* video blocks;
* marketplace;
* wizard as default mode.

Empty state:

```text
No exercises in this workout yet.

[Add exercise]
[Repeat previous]
[Choose template]
```

---

## 7. Journal

Purpose: history of completed workouts and notes.

Journal is not decorative.

Show:

* entries grouped by date;
* completed workouts;
* completed_as_note entries;
* client name;
* workout title;
* duration;
* exercise count;
* filled set count;
* volume if calculated;
* main progress hint.

Example:

```text
Today

18:00
Anna Sokolova
Legs · 52 min
4 exercises · 12 sets · 8 420 kg
Leg press +2.5 kg

[Open]

16:00
Elena Pak
Mobility · note
No sets logged

[Open]
```

Rules:

* every entry must be clickable;
* completed_as_note must be shown as note, not full workout;
* workout detail route: `/workouts/[workoutId]`.

Actions:

* Open workout detail
* Repeat workout
* Open client
* Copy Telegram message

Do not show:

* star ratings as core metric;
* decorative charts;
* entries that cannot be opened;
* fake progress.

Empty state:

```text
No workouts in journal yet.
Completed workouts and notes will appear here.

[Start workout]
```

---

## 8. Workout detail

Purpose: show exactly what happened in a completed workout.

Route:

```text
/workouts/[workoutId]
```

Show:

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

Do not show:

* only aggregate numbers without sets;
* fake AI summary;
* hidden workout data;
* unrelated CRM fields.

Error state:

```text
Workout not found.
It may have been deleted or unavailable.

[Back to journal]
```

---

## 9. Schedule

Purpose: connect plan and fact.

Core concept:

```text
schedule item = plan
workout = fact
```

Show:

* day/week view;
* schedule items;
* time;
* client;
* workout type/title;
* duration;
* status;
* quick action.

Statuses:

* planned
* upcoming
* completed
* missed
* cancelled

Example:

```text
Schedule
Today

+ Schedule workout

07:00 Dmitry · Intervals · Done
12:30 Mikhail · Back/chest · Done
18:00 Anna · Legs · Soon [Start]
20:00 Elena · Mobility [Start]
```

Actions:

* Start
* Reschedule
* Cancel
* Mark missed
* Open client

Add schedule item fields:

* Client
* Date
* Time
* Duration
* Workout type
* Comment
* Template optional

Rules:

* linked completed workout → schedule item becomes completed;
* missed does not spend paid session;
* cancelled does not spend paid session;
* workout can exist without schedule item;
* if workout happens near existing slot, offer to link it.

Do not show:

* crossed-out completed client names;
* complex desktop calendar grid in MVP;
* payment blockers;
* nutrition/habits/photos.

Empty state:

```text
Nothing scheduled for today.

[Schedule workout]
```

---

## 10. Add payment

Purpose: add paid sessions to a client.

This is money between client and coach.
This is not Trainly billing/access.

Fields:

* Client
* Number of sessions
* Amount, ₽ optional
* Comment optional

Success state:

```text
Done.
Elena Pak: +4 sessions.
Now 4 sessions left.

[Open client]
[Add another payment]
```

After saving, update:

* remaining sessions;
* payment state;
* client profile;
* overview warnings;
* payments tab.

Do not show:

* bank-like wording;
* subscription/access terms;
* YooKassa product billing here.

Empty state:

```text
Add a client first.

[New client]
```

---

## 11. Quick note

Purpose: quickly capture something important.

A note must affect the system later.
It must not become a useless text dump.

Fields:

* Client optional
* Type
* Text

Note types:

* general
* limitation
* payment
* progress
* complaint

Where notes appear:

* limitation → Client Pulse + pre-workout hints
* payment → Payments + attention items
* complaint → Pulse + pre-start
* progress → History/Progress
* general → client notes

Do not show:

* huge note editor;
* medical diagnosis fields;
* required client for general note;
* AI chat.

---

## 12. Billing/access

Purpose: Trainly product access for the coach.

Billing/access is different from client paid sessions.

Location:

* profile;
* settings;
* paywall screens.

Billing/access is not:

* main navigation tab;
* central plus action;
* inside workout logger.

Use wording:

* Tariff
* Access
* Buy access
* Extend access
* Access active until

Do not use:

* Subscription
* Auto-renewal

Do not show payment prompts inside active workout.

---

## 13. Empty states

No clients:

```text
No clients yet.
Add your first client and run the first workout.

[New client]
[Client + workout]
```

No workouts in journal:

```text
No workouts in journal yet.
Completed workouts and notes will appear here.

[Start workout]
```

No schedule:

```text
Nothing scheduled for today.

[Schedule workout]
```

No exercise history:

```text
First time doing this exercise.
History of weights and reps will appear after workout.
```

No payments:

```text
No payments yet.
You can add payment or track sessions as debt.

[Add payment]
```

AI credits exhausted:

```text
AI hints are over.
Rule-based hints still work.

[Buy +100]
[Upgrade to Pro]
```

---

## 14. Dangerous actions

Dangerous actions require confirmation:

* delete client;
* archive client;
* delete draft;
* exit workout without saving;
* cancel scheduled session;
* delete payment record if supported;
* delete workout if supported.

Use explicit confirmation button text:

* Delete client
* Archive client
* Delete draft
* Exit without saving
* Cancel session
* Delete payment

Do not use generic:

* OK
* Yes
* Confirm

for destructive actions.

---

## 15. Copy rules

UI language can be Russian in product, but specs are written in English.

Copy must be:

* short;
* practical;
* clear;
* mobile-friendly;
* action-oriented.

Avoid:

* corporate wording;
* fake motivation;
* medical diagnosis wording;
* legalistic language in normal flows;
* AI hype.

Use consistent terms:

* Client
* Workout
* Exercise
* Set
* Reps
* Weight
* Schedule
* Journal
* Access
* Tariff
* Limitation
* Note

Use “limitation”, not “diagnosis”.

Use “access”, not “subscription”.

Use “Journal” for completed workout history.

Do not call AI a chat in main UI.

Use:

* Hint
* Draft message
* Generate text
* What to remember
* Workout summary

Do not use:

* AI Chat
* Ask AI
* Fitness expert
* Diagnosis
* Treatment

```
