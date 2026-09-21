import { test, expect } from '@playwright/test'

test.describe('Shorebird Console Full Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Visit login
    await page.goto('/login')
  })

  test('complete console user journey including rename, create, and delete', async ({ page }) => {
    // 1. Verify Login page
    await expect(page.locator('.card-title')).toContainText('Shorebird Console')

    // 2. Submit token and login
    await page.fill('input[type="password"]', 'mock_shorebird_private_token')
    await page.click('button.submit-btn')

    // 3. Arrive at Apps List
    await expect(page).toHaveURL(/.*apps/)
    await expect(page.locator('.page-title')).toContainText('应用列表')
    const appLink = page.locator('.table-card .app-name-link:has-text("Shorebird Demo App")')
    await expect(appLink).toBeVisible()

    // 4. Test Rename App interactive prompt
    const firstRow = page.locator('.table-card .el-table__row').first()
    await firstRow.locator('button:has-text("改名")').click()
    await expect(page.locator('.el-message-box__title:has-text("重命名应用")')).toBeVisible()
    await page.fill('.el-message-box input', 'Shorebird Renamed App')
    await page.click('.el-message-box button:has-text("确定")')
    await expect(page.getByText('重命名成功')).toBeVisible()
    // Verify the renamed name appears on screen in the table!
    await expect(page.locator('.table-card').getByText('Shorebird Renamed App')).toBeVisible()

    // 5. Test Create App dialog
    await page.click('button:has-text("新建应用")')
    await expect(page.locator('.el-dialog__title:has-text("新建应用")')).toBeVisible()
    await page.fill('.el-dialog input', 'E2E Test App')
    await page.click('.el-dialog button:has-text("立即创建")')
    await expect(page.getByText('应用创建成功')).toBeVisible()
    await expect(page.locator('.el-dialog')).not.toBeVisible()
    // Verify newly created app appears in table
    await expect(page.locator('.table-card').getByText('E2E Test App')).toBeVisible()

    // 6. Test Delete App
    const createdRow = page.locator('.table-card .el-table__row:has-text("E2E Test App")')
    await createdRow.locator('button:has-text("删除")').click()
    await expect(page.locator('.el-message-box__title:has-text("危险警告")')).toBeVisible()
    await page.click('.el-message-box button:has-text("确认删除")')
    await expect(page.getByText('应用已删除')).toBeVisible()
    // Verify deleted app disappears from table
    await expect(page.locator('.table-card').getByText('E2E Test App')).not.toBeVisible()

    // 7. Navigate to Releases of the renamed app
    const renamedAppLink = page.locator(
      '.table-card .app-name-link:has-text("Shorebird Renamed App")',
    )
    await renamedAppLink.click()
    await expect(page).toHaveURL(/.*releases/)
    await expect(page.locator('.page-title')).toContainText('底包版本发布 (Releases)')
    await expect(page.getByText('1.0.0+1', { exact: true })).toBeVisible()

    // 8. Check artifacts drawer
    await page.locator('button:has-text("产物详情")').first().click()
    await expect(page.locator('.el-drawer__title:has-text("产物列表")')).toBeVisible()
    await expect(page.locator('text=aarch64')).toBeVisible()
    await page.locator('.el-drawer__close-btn').click()
    await expect(page.locator('.el-drawer')).not.toBeVisible()

    // 9. Navigate to Patches page
    await page.locator('button:has-text("查看补丁")').first().click()
    await expect(page).toHaveURL(/.*patches/)
    await expect(page.locator('.page-title')).toContainText('热更新补丁管理 (Patches)')
    await expect(page.locator('.table-card strong:has-text("#1")')).toBeVisible()

    // 10. Open Channel Management drawer
    await page.click('button:has-text("渠道管理")')
    await expect(page.locator('.el-drawer__title:has-text("应用渠道管理")')).toBeVisible()
    await expect(page.locator('.channel-manage').getByText('stable')).toBeVisible()
    await page.locator('.el-drawer__close-btn').click()
    await expect(page.locator('.el-drawer')).not.toBeVisible()

    // 11. Navigate to Diagnostics page
    await page.click('.sidebar-menu .el-menu-item:has-text("测速诊断")')
    await expect(page).toHaveURL(/.*diagnostics/)
    await expect(page.locator('.page-title')).toContainText('系统测速与网络诊断')

    // Test download speed
    await page.click('button:has-text("开始下载测速")')
    await expect(page.locator('.speed-result')).toBeVisible({ timeout: 10000 })

    // 12. Test Dark Mode toggle
    const htmlElement = page.locator('html')
    await page.click('.theme-btn')
    await expect(htmlElement).toHaveClass(/dark/)

    await page.click('.theme-btn')
    await expect(htmlElement).not.toHaveClass(/dark/)

    // 13. Test Logout
    await page.click('.user-avatar-trigger')
    await page.click('.el-dropdown-menu__item:has-text("退出登录")')
    await page.click('.el-message-box__btns button:has-text("确定")')

    await expect(page).toHaveURL(/.*login/)
  })
})
