# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side single-page web application that allows users to record personal financial transactions, categorize spending, set a total spending limit, and visualize their expenses through a pie chart and monthly summary. All data is persisted in the browser's `localStorage`, so no server or account is required. The app supports light and dark themes and is localized for Indonesian Rupiah (IDR).

## Glossary

- **App**: The Expense & Budget Visualizer single-page web application.
- **Transaction**: A single spending record that has a name, amount (in IDR), category, and date.
- **Category**: One of three fixed spending labels — Food, Transport, or Fun.
- **Spending Limit**: An optional IDR threshold set by the user above which the App highlights overspending.
- **Balance Card**: The hero section at the top of the page that displays the running total of all transactions.
- **Chart**: The doughnut/pie chart rendered by Chart.js that visualizes spending by category.
- **Monthly Summary**: The section that shows total spending and a category breakdown for a selected calendar month.
- **LocalStorage**: The browser's Web Storage API used to persist transactions, the spending limit, and the theme preference across page loads.
- **Theme**: The visual color scheme of the App — either light or dark.
- **Formatter**: The `Intl.NumberFormat` instance that formats IDR amounts using Indonesian locale conventions.

---

## Requirements

### Requirement 1: Add a Transaction

**User Story:** As a user, I want to add a named, categorized, and dated transaction with an IDR amount, so that I can track my individual expenses.

#### Acceptance Criteria

1. WHEN the user submits the transaction form with a valid item name, a positive integer amount in the range 1 to 999,999,999,999 (inclusive), and a selected category, THE App SHALL create a new Transaction with a unique identifier, the entered name trimmed of leading and trailing whitespace, the numeric amount, the selected category, and today's date in `YYYY-MM-DD` format.
2. WHEN a new Transaction is created, THE App SHALL prepend it to the top of the transactions list so the most recent entry appears first.
3. WHEN a Transaction is successfully added, THE App SHALL reset the item name input to empty, reset the amount input to empty, and reset the category selector to its default unselected placeholder state, then return focus to the item name input.
4. IF the user submits the form with any of item name, amount, or category missing or blank (whitespace only), THEN THE App SHALL display an inline error message reading "Please fill in item name, amount, and category." without creating a Transaction.
5. IF the user submits the form with an amount that is not a positive integer or exceeds 999,999,999,999, THEN THE App SHALL display an inline error message reading "Amount must be a whole number greater than 0." without creating a Transaction.
6. WHEN the user corrects a form error and successfully submits, THE App SHALL hide the previously displayed error message.
7. THE App SHALL support the following fixed set of categories for transaction classification: Food, Transport, and Fun.

---

### Requirement 2: Persist Transactions Across Page Loads

**User Story:** As a user, I want my transactions to be saved automatically, so that my data is available the next time I open the app.

#### Acceptance Criteria

1. WHEN a Transaction is added or deleted, THE App SHALL serialize the full transactions array to `localStorage` under the key `ebv-transactions`.
2. WHEN the App initializes, THE App SHALL read the transactions array from `localStorage` key `ebv-transactions` and restore all previously saved Transactions before any user interaction occurs.
3. IF the value stored at `ebv-transactions` is not a valid JSON array, THEN THE App SHALL discard the stored value, initialize with an empty transactions array, and display no transactions in the list.
4. IF `localStorage` is unavailable or throws an error when saving, THEN THE App SHALL keep transactions in memory for the current session and continue functioning without throwing an unhandled error.
5. IF `localStorage` is full when saving a Transaction, THEN THE App SHALL preserve the existing stored data, display an error message to the user indicating storage is full, and continue functioning for the current session.

---

### Requirement 3: Delete a Transaction

**User Story:** As a user, I want to remove a transaction I added by mistake, so that my spending total stays accurate.

#### Acceptance Criteria

1. WHEN the user activates the Delete button on a Transaction list item, THE App SHALL remove that Transaction from the transactions array immediately without a page reload.
2. WHEN a Transaction is deleted, THE App SHALL persist the updated transactions array to `localStorage` and re-render all dependent views (Balance Card, Chart, Monthly Summary, transaction list).
3. THE App SHALL render a Delete button for every Transaction list item with an accessible label of "Delete [item name]".
4. WHEN the last Transaction is deleted, THE App SHALL display the empty-state placeholder "No transactions yet." and hide the transaction list element.
5. IF `localStorage` throws an error when persisting a deletion, THEN THE App SHALL preserve the deletion in memory for the current session and continue functioning without throwing an unhandled error.

---

### Requirement 4: Display Running Total on the Balance Card

**User Story:** As a user, I want to see my total cumulative spending at a glance, so that I know how much I have spent overall.

#### Acceptance Criteria

1. THE App SHALL display the sum of all Transaction amounts on the Balance Card, formatted as an IDR currency string using Indonesian locale conventions (e.g., "Rp 1.500.000" with period as thousands separator and no decimal places).
2. WHEN no Transactions exist, THE App SHALL display "Rp 0" on the Balance Card.
3. WHEN a Transaction is added or deleted, THE App SHALL recalculate and update the Balance Card total within 500 ms.
4. IF all Transactions sum to zero (e.g., all deleted), THE App SHALL display "Rp 0" on the Balance Card.

---

### Requirement 5: Spending Limit with Visual Alert

**User Story:** As a user, I want to set a spending limit and be visually alerted when I exceed it, so that I can manage my budget.

#### Acceptance Criteria

1. WHEN the user enters a positive numeric value in the spending limit input and activates the Save Limit button, THE App SHALL store that value as the active Spending Limit in `localStorage` under the key `ebv-limit`.
2. WHEN the App initializes, THE App SHALL read the Spending Limit from `localStorage` key `ebv-limit`, populate the spending limit input field with that value, and reapply the corresponding visual state to the Balance Card.
3. WHILE a Spending Limit is active and the total spending exceeds the Spending Limit, THE App SHALL apply an "over" visual style to the Balance Card (changing its background to the danger color).
4. WHILE a Spending Limit is active and the total spending exceeds the Spending Limit, THE App SHALL display a note on the Balance Card reading "Over your limit by [amount] (limit [limit])", where both [amount] and [limit] are formatted as IDR currency strings using the same formatter as transaction amounts.
5. WHILE a Spending Limit is active and the total spending does not exceed the Spending Limit, THE App SHALL display a note on the Balance Card reading "[remaining] left before your [limit] limit", where both [remaining] and [limit] are formatted as IDR currency strings using the same formatter as transaction amounts.
6. WHILE no Spending Limit is active (limit is 0 or unset), THE App SHALL hide the spending limit note on the Balance Card.
7. IF the user saves a limit value that is 0, negative, or non-numeric, THEN THE App SHALL remove the `ebv-limit` key from `localStorage`, treat the Spending Limit as unset, hide the spending limit note, and revert the Balance Card background to its default style.

---

### Requirement 6: Spending by Category Pie Chart

**User Story:** As a user, I want to see a pie chart of my spending broken down by category, so that I can understand where my money goes.

#### Acceptance Criteria

1. WHEN at least one Transaction exists, THE App SHALL render a pie Chart showing each Category (Food, Transport, Fun) as a slice sized proportionally to that Category's share of total spending, with each Category represented by its own distinct fixed color.
2. WHEN no Transactions exist, THE App SHALL hide the Chart canvas and display the placeholder text "Add a transaction to see your chart."
3. WHEN a Transaction is added or deleted and the Chart instance already exists, THE App SHALL update the Chart's dataset and call its update method without destroying and re-creating the Chart instance.
4. IF a Transaction is added or deleted and no Chart instance exists, THEN THE App SHALL create and render a new Chart instance with the current Transaction data.
5. IF the Chart.js library fails to load, THEN THE App SHALL display the message "The chart could not load. Check your internet connection." in place of the Chart.
6. WHEN the Theme changes, THE App SHALL destroy the existing Chart instance and re-create it so that the legend text and slice border colors are legible against the new Theme's background color.
7. WHEN a Category has zero total spending, THE App SHALL omit that Category's slice from the Chart.

---

### Requirement 7: Transaction List Display

**User Story:** As a user, I want to see all my transactions in a scrollable list, so that I can review my spending history.

#### Acceptance Criteria

1. THE App SHALL render the transactions list in reverse-chronological insertion order (most recently added first).
2. WHEN no Transactions exist, THE App SHALL display the placeholder text "No transactions yet." and set the list element to `display:none`.
3. WHEN Transactions exist, THE App SHALL set the placeholder to `display:none` and render each Transaction as a list item showing: a category dot whose fill color matches the color defined for that category in the Category color map, the item name (truncated with an ellipsis at 50 characters), the category and date formatted as "[Category] · YYYY-MM-DD", the amount formatted as an IDR currency string, and a Delete button.
4. THE App SHALL constrain the transaction list to a maximum height of 320 px with vertical scrolling enabled for overflow.
5. WHEN the user clicks the Delete button on a Transaction list item, THE App SHALL remove that Transaction from the transactions list and re-render the list immediately.
6. IF a category referenced by a Transaction is not present in the Category color map, THEN THE App SHALL render the category dot using a neutral fallback color (gray).

---

### Requirement 8: Monthly Summary with Category Breakdown

**User Story:** As a user, I want to view a summary of spending for any calendar month, so that I can track trends over time.

#### Acceptance Criteria

1. WHEN the App initializes, THE App SHALL populate the month selector with all calendar months that contain at least one Transaction, plus the current calendar month, sorted in reverse-chronological order, with each option labeled in "MMMM YYYY" format (e.g., "January 2025").
2. WHEN the App initializes, THE App SHALL default the selected month to the current calendar month.
3. WHEN the user selects a different month from the month selector, THE App SHALL re-render the Monthly Summary for that month without reloading the page.
4. WHEN the selected month changes, THE App SHALL display the total spending for the selected month as an IDR currency string formatted with the "Rp" prefix and period-separated thousands groups (e.g., "Rp 12.500").
5. WHILE a Spending Limit is active and the selected month's total exceeds the Spending Limit, THE App SHALL apply a danger color style to the monthly total amount.
6. WHEN the selected month changes, THE App SHALL display the count of Transactions in the selected month as "[n] transaction" if n equals 1, or "[n] transactions" if n does not equal 1, including when n equals 0.
7. WHEN the selected month changes and the selected month contains at least one Transaction, THE App SHALL render a category breakdown showing, for each Category: the category name, its IDR-formatted total, and a proportional fill bar whose width is calculated as `(categoryTotal / monthTotal) * 100%` using the category's fixed color.
8. IF the selected month has no Transactions, THEN THE App SHALL display "Rp 0" as the month total, display "0 transactions" as the count label, and render all category fill bars at 0% width.

---

### Requirement 9: Light and Dark Theme

**User Story:** As a user, I want to toggle between light and dark themes, so that the app is comfortable to use in different lighting conditions.

#### Acceptance Criteria

1. WHEN the user activates the theme toggle button, THE App SHALL switch the active Theme between light and dark by setting or removing the `data-theme="dark"` attribute on the root `<html>` element.
2. WHEN the Theme is dark, THE App SHALL set the button label to "Light mode"; WHEN the Theme is light, THE App SHALL set the button label to "Dark mode".
3. WHEN the Theme changes, THE App SHALL persist the new Theme value to `localStorage` under the key `ebv-theme`.
4. WHEN the App initializes, THE App SHALL read the Theme from `localStorage` key `ebv-theme` and apply it; IF no Theme is stored, THEN THE App SHALL apply the Theme that matches the operating system's `prefers-color-scheme` media query; IF `prefers-color-scheme` is unsupported or returns no preference, THE App SHALL default to the light Theme; THE App SHALL also initialize the toggle button label to match the applied Theme.
5. THE App SHALL implement all Theme colors as CSS custom properties on `:root` (light) and `[data-theme="dark"]` so that all themed UI elements update automatically on Theme change.

---

### Requirement 10: Currency Formatting

**User Story:** As a user, I want all monetary values to be displayed in Indonesian Rupiah format, so that amounts are easy to read.

#### Acceptance Criteria

1. THE Formatter SHALL format all monetary amounts as Indonesian Rupiah with no decimal places, using the `id-ID` locale and `IDR` currency, such that the value `150000` is displayed as `Rp 150.000`.
2. THE App SHALL use the Formatter consistently for all displayed monetary amounts, including the Balance Card total, spending limit notes, Transaction list amounts, monthly totals, and category breakdown totals, such that no displayed amount uses a different format or locale.
3. IF a monetary amount is not a finite number, THEN THE Formatter SHALL display `Rp 0` instead of the invalid value.

---

### Requirement 11: Accessibility and Keyboard Navigation

**User Story:** As a user relying on assistive technology or keyboard navigation, I want the app to be operable and perceivable, so that I can use it without a mouse.

#### Acceptance Criteria

1. THE App SHALL mark the Balance Card section with `aria-live="polite"` so that screen readers announce Balance Card updates without interrupting the user.
2. THE App SHALL render the form error message in an element with `role="alert"` so that screen readers announce validation errors immediately upon display.
3. THE App SHALL set `aria-label="Delete [item name]"` on each Delete button, where [item name] is the name of the transaction being deleted.
4. THE App SHALL ensure all interactive controls (form inputs, category select, buttons, month selector) are reachable via sequential Tab key navigation and operable via Enter or Space key.
5. THE App SHALL apply a visible `:focus-visible` outline of at least 3 px solid in the accent color with a 2 px offset to all focused interactive elements, so that keyboard focus position is always visible.
