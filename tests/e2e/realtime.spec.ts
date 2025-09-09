// FIX: Changed 'test' to a default import and 'expect' to a named import to resolve module resolution errors.
import test, { expect } from '@playwright/test';

test.describe('Real-time Collaboration', () => {
  // Use a trip that is known to exist in the test DB or mock data. trip2 has collaborators.
  const tripUrl = '/#/app/trips/trip2';

  test('should reflect changes across different clients', async ({ browser }) => {
    // Client A
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto(tripUrl);

    // Client B
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto(tripUrl);

    // Make sure itinerary tab is visible
    await pageA.getByRole('button', { name: 'Itinerario' }).click();
    await pageB.getByRole('button', { name: 'Itinerario' }).click();

    // Wait for page to settle and sync
    await pageA.waitForTimeout(1000);

    const newBlockTitle = `Test Block ${Date.now()}`;

    // --- 1. Test Block Creation ---
    await pageA.getByRole('button', { name: '+ Añadir Bloque' }).click();
    await pageA.getByLabel('Título').fill(newBlockTitle);
    await pageA.getByLabel('Inicio').fill('14:00');
    await pageA.getByLabel('Fin').fill('15:00');
    await pageA.getByRole('button', { name: 'Añadir Bloque' }).click();

    // Assert: Block appears on both pages
    await expect(pageA.getByText(newBlockTitle)).toBeVisible();
    await expect(pageB.getByText(newBlockTitle)).toBeVisible({ timeout: 10000 }); // Longer timeout for propagation

    // --- 2. Test Block Editing ---
    const editedBlockTitle = `${newBlockTitle} - Edited by B`;
    const blockOnB = pageB.locator('.ml-4', { hasText: newBlockTitle });
    await blockOnB.click(); // Enter edit mode

    const titleInputB = pageB.locator('input[name="title"]');
    await expect(titleInputB).toHaveValue(newBlockTitle);
    await titleInputB.fill(editedBlockTitle);

    await pageB.getByRole('button', { name: 'Guardar' }).click();
    
    // Assert: Edit appears on both pages
    await expect(pageB.getByText(editedBlockTitle)).toBeVisible();
    await expect(pageA.getByText(editedBlockTitle)).toBeVisible({ timeout: 10000 });
    await expect(pageA.getByText(newBlockTitle)).not.toBeVisible();

    // --- 3. Test Block Deletion ---
    const blockOnA = pageA.locator('.ml-4', { hasText: editedBlockTitle });
    await blockOnA.click(); // Enter edit mode
    pageA.on('dialog', dialog => dialog.accept()); // auto-accept confirm dialog
    await pageA.getByRole('button', { name: 'Eliminar' }).click();
    
    // Assert: Block disappears from both pages
    await expect(pageA.getByText(editedBlockTitle)).not.toBeVisible();
    await expect(pageB.getByText(editedBlockTitle)).not.toBeVisible({ timeout: 10000 });
    
    // --- 4. Test Live Cursors ---
    await pageA.mouse.move(500, 500);
    // Give a moment for the event to propagate
    await pageA.waitForTimeout(500);
    // This tests that *a* collaborator cursor is visible, without being tied to a specific name from mock data.
    const cursorOnB = pageB.locator('[data-testid^="cursor-"]');
    await expect(cursorOnB).toBeVisible();
    
    // Clean up contexts
    await contextA.close();
    await contextB.close();
  });
});