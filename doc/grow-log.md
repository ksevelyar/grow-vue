# Grow log
## Requirements
* The detail page uses the grow-log BEM block.
* A grow log’s detail page shows its entries newest first.
* Each entry has a date, stage, and optional description.
* An entry stage is germination, seedling, vegetation, or bloom.
* The detail page shows one report form initialized to the current date.
* If no entry exists for the current date, the form is empty, its stage defaults to the most recent previous entry’s stage when available, and its action is Create.
* Saving a report with no existing entry for its date creates an entry.
* If an entry exists for the current date, its values appear in the report form and its action is Update.
* Each history entry has an Edit action that loads the entry into the report form.
* Saving a report with an existing entry updates it.
* After a successful save, the form returns to the current date’s report.
* Each history entry has a Delete action.
* Deleting an entry removes it from the history.

## User scenarios
### 1. User can view grow-log details
1. The user opens a grow log.
2. The user sees the grow-log details.

### 2. User can view entry history
1. The user opens a grow log with multiple entries.
2. The user sees the entries newest first.

### 3. User can create today’s report
1. The user opens a grow log without an entry for today.
2. The user enters a date, selects a stage, and optionally enters a description.
3. The user creates the report and sees it in the entry history and loaded in the report form.

### 4. User can update an existing report
1. The user opens a grow log with an entry for today or selects Edit beside another entry.
2. The user changes the entry’s date, stage, or description in the report form.
3. The user updates the report and the form returns to today’s report.

### 5. User can delete a report
1. The user selects Delete beside an entry and confirms the deletion.
2. The user no longer sees the entry in the history.
