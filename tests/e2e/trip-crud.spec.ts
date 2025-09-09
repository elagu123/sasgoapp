// FIX: Changed 'test' to a default import and 'expect' to a named import to resolve module resolution errors.
import test, { expect } from '@playwright/test';

test.describe('Trip CRUD Operations', () => {
  const newTripTitle = `Test Trip ${Date.now()}`;
  const editedTripTitle = `Edited: ${newTripTitle}`;

  // Use test.beforeEach to ensure a clean state if tests were independent,
  // but here we run them sequentially to test the full lifecycle.
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard before each test
    await page.goto('/#/app/dashboard');
    // Wait for the dashboard to load by checking for the header
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
  });

  test('should allow a user to create, edit, and then delete a new trip', async ({ page }) => {
    // === CREATE TRIP ===
    // 1. Open the creation dialog
    await page.getByRole('button', { name: '+ Planear nuevo viaje' }).click();
    await expect(page.getByRole('heading', { name: 'Planear Nuevo Viaje' })).toBeVisible();

    // 2. Fill the form
    await page.getByLabel('Título del Viaje').fill(newTripTitle);
    await page.getByLabel('Destino').fill('Playwright City');
    await page.getByLabel('Fecha de Inicio').fill('2025-10-01');
    await page.getByLabel('Fecha de Fin').fill('2025-10-08');

    // 3. Save the trip
    await page.getByRole('button', { name: 'Guardar Viaje' }).click();

    // 4. Assert the new trip is visible on the dashboard
    const newTripCard = page.locator('.trip-card', { hasText: newTripTitle });
    await expect(newTripCard.getByRole('heading', { name: newTripTitle })).toBeVisible();
    await expect(newTripCard.getByText('Playwright City')).toBeVisible();

    // === EDIT TRIP ===
    // 1. Open the edit dialog for the newly created trip
    await newTripCard.getByRole('button', { name: 'Editar' }).click();
    await expect(page.getByRole('heading', { name: 'Editar Viaje' })).toBeVisible();

    // 2. Edit the title
    await page.getByLabel('Título del Viaje').fill(editedTripTitle);
    
    // 3. Save the changes
    await page.getByRole('button', { name: 'Guardar Viaje' }).click();

    // 4. Assert the title has been updated on the dashboard
    const editedTripCard = page.locator('.trip-card', { hasText: editedTripTitle });
    await expect(editedTripCard.getByRole('heading', { name: editedTripTitle })).toBeVisible();
    await expect(page.getByRole('heading', { name: newTripTitle })).not.toBeVisible();

    // === DELETE TRIP ===
    // Set up a listener for the confirmation dialog to automatically accept it
    page.on('dialog', dialog => dialog.accept());

    // 1. Click the delete button on the edited trip
    await editedTripCard.getByRole('button', { name: 'Eliminar viaje' }).click();

    // The dialog is handled by the listener above.
    
    // 2. Assert the trip is no longer on the dashboard
    await expect(page.getByRole('heading', { name: editedTripTitle })).not.toBeVisible();
  });
});