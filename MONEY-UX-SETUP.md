# Joye Life v3.0.7

Run `supabase/migrations/008_money_due_dates.sql` in Supabase before testing the updated Money forms.

Changes:
- Adds sign out on desktop and mobile.
- Changes bill and debt due fields to calendar date selectors.
- Keeps older `due_day` values readable for existing records.
- Simplifies Money page labels and descriptions.
- Reworks paycheck allocation cards for narrow mobile screens.
