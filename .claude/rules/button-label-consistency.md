# Button Label Consistency Rule

## Save vs Update
- **Always use "Save"** for all create/update actions — never "Update"
- This applies to: dialogs, forms, inline edits, management company settings
- The Save button should use the `<Save>` lucide icon consistently

## Button Patterns
- Create actions: "Add [Entity]" or "New [Entity]" with Plus icon
- Save/update actions: "Save" with Save icon  
- Delete actions: "Delete" with Trash2 icon, always with confirmation dialog
- Cancel actions: "Cancel" with no icon

## Disabled States
- Save buttons should be disabled when: form is empty, no changes made, mutation is pending
- Show Loader2 spinner when mutation is pending
