# Grow logs
## Requirements
* Users can create, update, and delete grow logs.
* A grow log has a name, plant, start date, description, end date, and outcome.
* Creating a grow log requires a name, plant, and start date.
* Grow logs are ordered by their latest entry date.
* A grow log uses its most recent entry photo as its cover.
* Deleting a grow log also deletes its entries and photos.

## User scenarios
### 1. A user views grow logs
1. Sign in with two grow logs. Give one log an entry with a photo followed by an entry without a photo.
2. Open the main page.
3. Verify the logs are ordered by latest entry date.
4. Verify the photo appears as the log’s cover.

### 2. A user creates a grow log
1. Open the main page and select New log.
2. Enter a name, select a plant, and enter a start date.
3. Create the log.
4. Verify the new log opens.

### 3. A user sees a validation error when creating a grow log
1. Open the new grow-log form and enter a whitespace-only name, plant, and start date.
2. Create the log and return `must not be empty` for the name.
3. Verify the error appears.

### 4. A user updates a grow log
1. Open a grow log and select Edit.
2. Change its name, plant, start date, description, end date, or outcome.
3. Save the changes.
4. Verify the updated details appear.

### 5. A user deletes a grow log
1. Open a grow log and select Edit.
2. Delete the log and confirm.
3. Verify the grow-log list opens without the deleted log.
