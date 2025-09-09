// FIX: Changed 'test' to a default import and 'expect' to a named import to resolve module resolution errors.
import test, { expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Navigate to the app and simulate login if needed
  await page.goto('/');
  // This test assumes the user is already logged in or the page is public.
  // For protected routes, you would typically set up auth state here.
});

test('Add block then persist after refresh', async ({ page }) => {
  await page.goto('/#/app/trips/trip2');
  
  // Ensure the itinerary tab is active
  await page.getByRole('button', { name: 'Itinerario' }).click();

  await page.getByRole('button', { name: '+ Añadir Bloque' }).click();
  
  // Fill out the form in the dialog
  await page.getByLabel('Título').fill('Museo Moderno');
  await page.getByLabel('Inicio').fill('10:00');
  await page.getByLabel('Fin').fill('11:00');
  
  await page.getByRole('button', { name: 'Añadir Bloque' }).click();
  
  // Check if the new block is visible on the page
  await expect(page.getByText('Museo Moderno')).toBeVisible();
  
  // Reload the page to check for persistence (in a real app with a backend)
  await page.reload();
  
  // After reload, the block should still be visible (this might fail with mock data)
  await expect(page.getByText('Museo Moderno')).toBeVisible();
});