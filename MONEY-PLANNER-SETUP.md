# Money Planner setup

Run `supabase/migrations/007_money_planner.sql` in the Supabase SQL Editor before opening the new Money page.

The Money module now includes:
- income and pay-frequency setup
- recurring bills
- debt accounts with APR, minimums, and credit limits
- debt-to-income and utilization calculations
- zero-based paycheck allocation
- recent paycheck-plan history
- limited Money Joye guidance using saved member data

Debt-to-income is shown as monthly debt minimum payments divided by gross monthly income. It is an educational planning metric, not underwriting or professional financial advice.
