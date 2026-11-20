import {focusEditor, getEditorStateJSON, initialize, insertCard} from '../utils/e2e';
import {expect, test} from '@playwright/test';

test.describe('Table card', async () => {
    let page;

    test.beforeAll(async ({browser}) => {
        page = await browser.newPage();
    });

    test.beforeEach(async () => {
        await initialize({page});
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('focuses a cell on the first click and serializes input immediately', async () => {
        await focusEditor(page);
        const card = await insertCard(page, {cardName: 'table'});
        const trailingParagraph = page.locator('[data-lexical-editor] > p').last();
        await trailingParagraph.click();

        const table = card.locator('table');
        const firstCell = table.locator('[data-kg-table-cell]').first();
        const topBefore = (await table.boundingBox()).y;

        await firstCell.click();
        await expect(firstCell).toBeFocused();
        await page.keyboard.type('Alpha');

        await expect(firstCell).toHaveText('Alpha');
        await expect(card.getByRole('toolbar', {name: '表格操作'})).toBeVisible();
        expect((await table.boundingBox()).y).toBe(topBefore);

        const state = JSON.parse(await getEditorStateJSON(page));
        const tableNode = state.root.children.find(node => node.type === 'table');
        expect(tableNode.rows[0][0].text).toBe('Alpha');
    });

    test('moves between cells with Tab without trapping focus at the edge', async () => {
        await focusEditor(page);
        const card = await insertCard(page, {cardName: 'table'});
        const cells = card.locator('[data-kg-table-cell]');

        await cells.first().click();
        await page.keyboard.press('Tab');
        await expect(cells.nth(1)).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(cells.first()).toBeFocused();
    });
});
