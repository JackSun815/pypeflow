# Meeting Import Guide

## Supported File Formats
- **CSV** (.csv) - Comma-separated values
- **Excel** (.xlsx, .xls) - Microsoft Excel files

## Required Columns

These columns are **required** for each meeting:

1. **Contact Full Name** - The full name of the contact person
2. **Contact Email** - Email address of the contact
3. **Meeting Date** - Date of the meeting (see formats below)
4. **Meeting Time** - Time of the meeting (see formats below)
5. **Client Name** - Must match an existing client name exactly (or select a client before importing)

## Optional Columns

These columns are optional but recommended:

- **Contact Phone** - Phone number
- **Title** - Job title/position
- **Company** - Company name
- **LinkedIn Page** - LinkedIn profile URL
- **Prospect Timezone** - Timezone (defaults to America/New_York if not provided)
- **Meeting Booked Date** - Date when the meeting was booked (defaults to today if not provided)
- **Notes** - Additional notes about the meeting

## Date Formats Supported

The import function supports multiple date formats:

- **MM/DD/YYYY**: `11/21/2025`, `12/05/2025`
- **YYYY-MM-DD**: `2025-11-21`, `2025-12-05`
- **Month Day, Year**: `November 21, 2025`, `December 5, 2025`
- **Day Month Year**: `Friday November 21st 2025`, `Fri, Nov 21, 2025`

## Time Formats Supported

The import function supports multiple time formats:

- **12-hour with AM/PM**: `10:00 AM`, `2:30 PM`
- **12-hour with timezone**: `10:00 AM EST`, `2:30 PM PST`
- **24-hour format**: `14:00`, `09:30`

## Column Name Variations

The import function is flexible with column names (case-insensitive):

- **Contact Full Name**: Also accepts "Contact Name", "Full Name", "Name", "Contact"
- **Contact Email**: Also accepts "Email", "Email Address"
- **Meeting Date**: Also accepts "Date", "Scheduled Date", "Meeting Scheduled Date"
- **Meeting Time**: Also accepts "Time", "Scheduled Time", "Meeting Scheduled Time"
- **Client Name**: Also accepts "Client", "Company Name"
- **Contact Phone**: Also accepts "Phone", "Phone Number"
- **LinkedIn Page**: Also accepts "LinkedIn", "LinkedIn URL", "LinkedIn Profile"
- **Prospect Timezone**: Also accepts "Timezone", "Time Zone"
- **Meeting Booked Date**: Also accepts "Booked Date", "Created Date"

## Example Spreadsheet

See `meeting_import_example.csv` for a complete example with sample data.

## Important Notes

1. **Client Matching**: The Client Name must match exactly (case-insensitive) with an existing client in your dashboard. Alternatively, you can select a client before importing, and all meetings will be assigned to that client.

2. **Timezone**: If Prospect Timezone is not provided, it defaults to `America/New_York` (EST).

3. **Meeting Booked Date**: If not provided, defaults to today's date.

4. **Status**: All imported meetings are created with status "pending".

5. **Empty Rows**: Empty rows are automatically skipped.

6. **Error Handling**: If some rows fail to import, the import will continue processing other rows and show you a summary of successes and errors.

## Tips

- Use the CSV example file as a template
- Ensure Client Names match exactly with your existing clients
- Use consistent date and time formats for best results
- Include all required columns in your spreadsheet
- Test with a small file first before importing large batches

