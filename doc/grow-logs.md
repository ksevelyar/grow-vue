# Grow logs
## Requirements
* After signing in, the user sees grow-log cards.
* Grow logs are sorted by the date of their latest entry.
* A grow log with entry photos uses its most recent available photo as its cover, even when the latest entry has no photo.
* A grow log without entry photos uses a grey cover.
* Each card shows the grow-log start date in dd-mm-yy format.
* Clicking a grow log opens its detail page.
* The user can create a grow log with a name, plant, and start date.
* After creation, the user sees the new log’s detail page.
* The user can update a grow log’s name, plant, start date, description, end date, and outcome.
* After saving, the user sees the updated grow-log details.
* The user can delete a grow log from its edit page.
* Deleting a grow log also deletes its entries and photos.
* After deletion, the user returns to the grow-log list and no longer sees the deleted log.

## User scenarios
### 1. User can see the grow-log list
1. The user has two grow logs, one with entry photos and one without.
2. The user opens the main page.
3. The user sees the logs sorted by latest entry date, with the most recent available photo or a grey cover for each log.

### 2. User can create a grow log
1. The user opens the main page and selects New log.
2. The user enters a name, selects a plant, and enters a start date.
3. The user creates the log and sees its detail page.

### 3. User can update a grow log
1. The user opens a grow log and selects Edit.
2. The user changes its name, plant, start date, description, end date, or outcome.
3. The user saves the changes and sees the updated grow-log details.

### 4. User can delete a grow log
1. The user opens a grow log and selects Edit.
2. The user deletes the log and confirms the deletion.
3. The user returns to the grow-log list and no longer sees the deleted log.
