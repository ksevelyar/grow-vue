# Plants
## Requirements
* The user can view a list of plants.
* The user can create a plant with a name.
* The user can rename a plant.
* The user can delete a plant when it has no grow logs.
* The user cannot delete a plant that has grow logs.
* The user sees an explanation when deletion is prevented.
* A plant page shows its grow logs with their start dates and active or completed statuses.
* Clicking a grow log opens its detail page.

## User scenarios
### 1. User can see the plant list
1. The user opens the plants page.
2. The user sees their plants.

### 2. User can create a plant
1. The user opens the plants page.
2. The user enters a plant name.
3. The user creates the plant and sees it in the list.

### 3. User can rename a plant
1. The user changes a plant’s name.
2. The user saves the name and sees the updated name.

### 4. User can delete a plant without grow logs
1. The user deletes a plant that has no grow logs.
2. The user no longer sees the plant in the list.

### 5. User cannot delete a plant with grow logs
1. The user tries to delete a plant that has grow logs.
2. The user sees an explanation that the plant cannot be deleted.

### 6. User can view a plant’s grow logs
1. The user opens a plant.
2. The user sees its grow logs with their start dates and statuses.
3. The user selects a grow log and sees its detail page.
