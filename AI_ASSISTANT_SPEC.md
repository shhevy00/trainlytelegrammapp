Product: Trainly / “Тренерский дневник”  
Scope: Contextual AI helper  
Platform: Telegram Mini App / mobile web app

## 1. Core principle

AI is not a separate product area.

AI is not:

- a main tab;
- a chat;
- a generic fitness coach;
- a medical advisor;
- a replacement for the human trainer.

AI is a contextual helper inside existing workflows.

Main flow:

```text
data → rule-based facts → optional AI wording → user copies/edits/confirms
````

Rule-based facts come first.
OpenAI/ChatGPT API is used only to turn selected facts into short useful text.

---

## 2. AI placements

AI may appear only in contextual places:

1. Client Pulse
2. Pre-workout “What to remember”
3. Post-workout summary
4. Telegram message draft
5. Payment reminder draft
6. Inactive client message draft

Do not create an AI tab.
Do not create a generic AI chat.

---

## 3. Rule-based facts

Rule-based facts are free and deterministic.

Examples:

* remainingSessions <= 1;
* remainingSessions == 0;
* debt exists;
* inactiveDays >= 10;
* limitation exists;
* no next workout;
* no measurements for 14+ days;
* exercise stagnation;
* notable progress;
* new best result;
* missed planned workout;
* workout completed today;
* unfinished draft exists.

Rule-based facts must be shown before AI generation.

Example:

```text
Facts used:
- 1 session left
- inactive for 12 days
- no next workout scheduled
```

---

## 4. OpenAI generation actions

Each generation is explicit.

User must press a button such as:

* Generate summary
* Generate message
* Make shorter
* Softer
* Stricter
* Rewrite

Generation types:

* `pulse_summary`
* `pre_workout_hint`
* `post_workout_summary`
* `telegram_session_followup`
* `payment_reminder`
* `inactive_client_outreach`
* `rewrite_message`

No automatic AI generation on page load in MVP.

---

## 5. Credit rules

Simple MVP rule:

```text
1 OpenAI generation = 1 AI credit
```

Rules:

* rule-based insight = 0 credits;
* copy existing generated text = 0 credits;
* first generation = 1 credit;
* rewrite = 1 credit;
* “make shorter” = 1 credit;
* “softer” = 1 credit;
* “stricter” = 1 credit;
* failed API call = 0 credits.

If credits are exhausted, do not call OpenAI.

Show:

```text
AI hints are over.
Rule-based hints still work.

[Buy +100]
[Upgrade to Pro]
```

Do not use fractional credits in MVP.

---

## 6. Privacy rules

Never send to OpenAI:

* full legal name if not needed;
* phone number;
* Telegram username;
* address;
* payment details;
* photos;
* medical diagnosis;
* raw private notes unrelated to the task.

Use minimized context.

Allowed examples:

* client label: “Client” or first name only;
* goal category;
* limitation as non-medical wording;
* remaining sessions;
* last workout facts;
* exercise results;
* schedule state.

Example input:

```json
{
  "clientAlias": "Client",
  "goal": "weight loss",
  "limitations": ["knee"],
  "remainingSessions": 1,
  "lastExerciseResults": ["110x10", "110x8"]
}
```

The trainer should be able to see which facts were used.

---

## 7. Output rules

AI output must be:

* Russian in production UI;
* short;
* practical;
* cautious;
* based only on provided data;
* editable before sending;
* copyable.

AI output must not:

* invent facts;
* diagnose;
* prescribe treatment;
* promise results;
* shame the client;
* manipulate the client;
* mention hidden system data;
* claim certainty where data is weak.

Use cautious phrases:

* “можно попробовать”
* “стоит учесть”
* “если самочувствие ок”
* “пора напомнить”
* “лучше не форсировать”

---

## 8. Client Pulse AI

Client Pulse combines rule-based facts and optional AI wording.

Rule facts example:

```text
Today: legs at 18:00
Limitation: knee
Remaining sessions: 1
Last leg press: 110×10 · 110×8
```

AI output example:

```text
Сегодня тренировка ног. Стоит учесть колено и не форсировать резкие выпады. В жиме ногами можно ориентироваться на прошлые 110×10 и попробовать небольшой шаг вверх, если самочувствие ок.
```

---

## 9. Pre-workout hint

Used before workout start.

Input should include:

* workout focus;
* limitation;
* remaining sessions;
* last relevant result;
* inactive warning if any.

Output must be 1–3 short sentences.

Do not generate full workout plan unless user explicitly chooses template/program flow.

---

## 10. Post-workout summary

Used after completion.

Input should include only actual completed data:

* exercises;
* filled sets;
* notable progress;
* comments;
* duration;
* volume if calculated.

AI must not praise fake progress.

If there is no progress data, say neutral summary.

Example:

```text
Тренировка сохранена: 4 упражнения, 12 подходов. В жиме ногами зафиксирован лучший подход 112.5×8. Колено без жалоб — в следующий раз можно сохранить осторожный темп.
```

---

## 11. Telegram session follow-up

Purpose: draft message to client after workout.

Rules:

* friendly;
* short;
* no medical claims;
* no overpromising;
* no pressure.

Example:

```text
Анна, сегодня хорошо отработали ноги. В жиме ногами получилось 112.5×8, это небольшой шаг вперёд относительно прошлого раза. В следующий раз продолжим аккуратно, с учётом колена.
```

User can:

* copy;
* edit;
* make shorter;
* make softer.

---

## 12. Payment reminder

Purpose: polite payment reminder.

Input:

* sessions remaining;
* payment state;
* last payment date if available.

Rules:

* no pressure;
* no guilt;
* no aggressive debt wording.

Example:

```text
Анна, напомню: осталось 1 оплаченное занятие. Можно будет пополнить пакет до следующей тренировки.
```

---

## 13. Inactive client outreach

Purpose: soft reactivation message.

Input:

* days since last workout;
* last workout if available;
* goal;
* no next workout flag.

Rules:

* no blame;
* no shame;
* no “you disappeared” tone.

Example:

```text
Ольга, привет! Давно не виделись на тренировке — уже около двух недель. Можем спокойно поставить следующую дату и вернуться в удобном темпе.
```

---

## 14. Rewrite actions

Rewrite actions:

* shorter;
* softer;
* stricter;
* without payment mention;
* more professional.

Each rewrite costs 1 credit.

Rewrite must preserve facts.

Do not add new claims.

---

## 15. Server-side requirements

OpenAI calls must happen only on server.

Never expose API key to frontend.

Server must:

* validate trainer session;
* check AI credits before call;
* collect allowed facts;
* remove forbidden PII;
* call OpenAI;
* save generation metadata;
* decrement credit only after successful generation;
* return text to client.

Failed API call does not consume credit.

---

## 16. Logging

Log:

* trainerId;
* generation type;
* timestamp;
* prompt version;
* credit spent;
* success/failure;
* related client/workout/payment id if relevant.

Do not log raw forbidden PII.

Prompt logs must be masked or disabled in production if privacy policy requires.

---

## 17. Acceptance criteria

AI layer is acceptable when:

1. There is no AI main tab.
2. There is no generic AI chat.
3. Rule-based facts are shown before AI text.
4. OpenAI generation requires explicit user action.
5. Every OpenAI generation costs exactly 1 credit.
6. Copying text costs 0 credits.
7. Failed API calls cost 0 credits.
8. Credits block API calls when exhausted.
9. OpenAI API key is never exposed to frontend.
10. Forbidden PII is not sent to OpenAI.
11. Output is short and cautious.
12. Output never invents workout data.
13. Trainer can copy/edit generated text.
14. AI is available only inside product flows.

