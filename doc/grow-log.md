# Grow log
## Requirements
* Users can create, update, and delete entries.
* Each entry has a date, stage, and optional description.
* A grow has at most one entry per date.
* Stages progress through germination, seedling, vegetation, and bloom. Stages may be skipped.
* A stage begins with its first entry and ends the day before the next stage begins.
* The final stage duration and grow day and week are calculated through today, or the end date for a completed grow.
* Entries are ordered by date, newest first.
* A new report defaults to the most recent previous entry’s stage when available.

## User scenarios
### 1. A user views grow-log details
1. Open a mustard grow on 20 November 2026. It started on 15 October, entered vegetation on 17 October, and entered bloom on 16 November. Its description is `coco + perlite`.
2. Verify the summary shows `Day 37 · Week 6`, 30 days of vegetation, and 5 days of bloom.
3. Verify `coco + perlite` appears.

### 2. A user views entry history
1. Open a mustard grow started on 15 October 2026, with vegetation starting on 17 October, bloom starting on 16 November, and entries on 19 and 20 November. The 17 October entry has the description `First leaves`.
2. Verify the 20 November entry appears first and shows `Day 37 · Week 6 · bloom 5`.
3. Verify the 19 November entry shows `Day 36 · Week 6 · bloom 4`.
4. Verify the 17 October entry shows vegetation and `First leaves`.

### 3. A user creates today’s report
1. Open a grow log without an entry for today.
2. Verify the report form shows today’s date and offers Create.
3. Enter a stage and description, then create the report.
4. Verify the entry appears in the history and the report form.

### 4. A user updates a report
1. Open a grow log and select Edit beside an entry.
2. Change its date, stage, or description and select Update.
3. Verify the changes appear in the history and the form returns to today’s report.

### 5. A user deletes a report
1. Select Delete beside an entry and confirm.
2. Verify the entry no longer appears in the history.

### 6. A user views a completed grow
1. Open a mustard grow on 25 November 2026. It started on 15 October, entered vegetation on 17 October, entered bloom on 16 November, and ended on 20 November. Its outcome is `Healthy harvest`.
2. Verify the summary shows `Day 37 · Week 6`, 30 days of vegetation, and 5 days of bloom.
3. Verify `Healthy harvest` appears.

### 7. A user cannot save a report for a date with an existing entry
1. Open a mustard grow with vegetation entries on 1 and 15 April 2026.
2. Edit the 15 April entry, change its date to 1 April, and save.
3. Verify a date validation error appears.

### 8. A user cannot save a report with an earlier stage
1. Open a mustard grow that entered vegetation on 1 April 2026 and bloom on 1 May.
2. Enter a report for 6 May, select vegetation, and save.
3. Verify a stage validation error appears.
