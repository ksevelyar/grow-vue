# Grow log gallery and photos
## Requirements
* A grow-log entry can have zero or more photos.
* The detail page shows a gallery of every entry photo below the basic grow-log data.
* Each history entry shows thumbnails of its own photos.
* The report form supports uploading multiple photos to the selected entry and removing existing photos from it.
* After uploading or removing a photo, the report form, entry history, and gallery show the current photos.
* Deleting an entry also deletes its photos.
* Clicking a gallery or entry thumbnail opens the shared full-screen viewer at that photo in original quality.
* The full-screen viewer navigates through all log photos with the left and right arrow keys and closes with Escape or a close control.

## User scenarios
### 1. User can upload photos to a report
1. The user opens a grow log and selects multiple photos in the report form.
2. The user saves the report.
3. The user sees successfully uploaded photos in the report form, entry history, and gallery. Any upload failures are reported.

### 2. User can remove a photo from an entry
1. The user loads an entry into the report form, either by opening today’s report or clicking Edit.
2. The user removes one of its photos.
3. The photo no longer appears in the report form, entry history, or gallery.

### 3. User can delete an entry and its photos
1. The user deletes an entry that has photos and confirms the deletion.
2. The entry and its photos are deleted and no longer appear in the history or gallery.

### 4. User can browse all log photos
1. The user opens a grow log with photos on multiple entries.
2. The user sees every photo in the gallery, including photos on older entries, and each entry shows its own thumbnails.
3. The user clicks a gallery or entry thumbnail and sees that original-quality photo in the shared full-screen viewer.
4. The user presses the left or right arrow key to browse all log photos, then closes the viewer with Escape or the close control.
