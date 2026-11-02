#!/bin/bash
# Batch update all button elements to add glass-lens class

set -e

FILES=(
  "frontend/components/ui/Dialog.tsx"
  "frontend/components/ui/Modal.tsx"
  "frontend/components/ui/Toast.tsx"
  "frontend/components/ui/Select.tsx"
  "frontend/components/ui/Switch.tsx"
  "frontend/components/ui/Tabs.tsx"
  "frontend/components/ui/DropdownMenu.tsx"
  "frontend/components/ui/Calendar.tsx"
  "frontend/components/ui/DateRangePicker.tsx"
  "frontend/components/chat/ChatMessage.tsx"
  "frontend/components/chat/TransactionCard.tsx"
  "frontend/components/dashboard/HealthScore.tsx"
  "frontend/components/dashboard/MoneyMovement.tsx"
  "frontend/components/settings/CurrencySelect.tsx"
  "frontend/components/settings/ImportExportModal.tsx"
  "frontend/components/transactions/TransactionTypeTabs.tsx"
  "frontend/components/accounts/AccountsGrid.tsx"
  "webapp/components/ui/Dialog.tsx"
  "webapp/components/ui/Modal.tsx"
  "webapp/components/ui/Toast.tsx"
  "webapp/components/ui/Select.tsx"
  "webapp/components/ui/Switch.tsx"
  "webapp/components/ui/Tabs.tsx"
  "webapp/components/ui/DropdownMenu.tsx"
  "webapp/components/ui/Calendar.tsx"
  "webapp/components/chat/ChatHistoryPanel.tsx"
  "webapp/components/chat/ChatInput.tsx"
  "webapp/components/chat/ChatMessage.tsx"
  "webapp/components/chat/ChatSuggestions.tsx"
  "webapp/components/chat/QuickChoices.tsx"
  "webapp/components/chat/TransactionCard.tsx"
  "webapp/components/settings/CurrencySelect.tsx"
  "webapp/components/settings/ImportExportModal.tsx"
  "webapp/components/transactions/TransactionTypeTabs.tsx"
  "webapp/components/transactions/AddIncomeModal.tsx"
  "webapp/components/accounts/AccountsGrid.tsx"
  "webapp/components/webapp/WebappSidebar.tsx"
  "webapp/components/webapp/WebappSettingsModal.tsx"
  "webapp/components/webapp/TopbarActions.tsx"
  "webapp/components/webapp/MobileTabBar.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    # Add glass-lens to button className attributes that don't already have it
    perl -i -pe 's/(<button[^>]*className=")(?!.*glass-lens)([^"]*")/$1glass-lens $2/g' "$file"
  fi
done

echo "✓ Updated all button elements with glass-lens class"
