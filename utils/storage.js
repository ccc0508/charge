/**
 * 记账小程序 - 数据存储工具
 * 基于 wx.getStorageSync / wx.setStorageSync 实现本地持久化
 */

const STORAGE_KEY = 'charge_records'

/**
 * 生成唯一 ID（时间戳 + 随机数）
 * @returns {string}
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/**
 * 获取所有记录
 * @returns {Array} 记录数组
 */
function getRecords() {
    return wx.getStorageSync(STORAGE_KEY) || []
}

/**
 * 保存一条记录
 * 自动添加唯一 ID 和创建时间戳，最新记录排在最前
 *
 * @param {object} record - { amount, type, category, note?, date }
 * @returns {object} 添加了 id 和 createdAt 的完整记录
 *
 * @example
 * saveRecord({
 *   amount: 35.5,
 *   type: 'expense',
 *   category: 'food',
 *   note: '午餐',
 *   date: '2026-02-25'
 * })
 */
function saveRecord(record) {
    const records = getRecords()
    const newRecord = {
        ...record,
        id: generateId(),
        amount: Math.round(parseFloat(record.amount) * 100) / 100,
        note: record.note || '',
        createdAt: Date.now()
    }
    records.unshift(newRecord)
    wx.setStorageSync(STORAGE_KEY, records)
    return newRecord
}

/**
 * 删除一条记录
 * @param {string} id - 记录 ID
 * @returns {boolean} 是否删除成功
 */
function deleteRecord(id) {
    const records = getRecords()
    const index = records.findIndex(r => r.id === id)
    if (index === -1) return false
    records.splice(index, 1)
    wx.setStorageSync(STORAGE_KEY, records)
    return true
}

/**
 * 获取指定月份的记录
 * @param {number} year  - 年份，如 2026
 * @param {number} month - 月份 1-12
 * @returns {Array} 匹配的记录
 *
 * @example
 * const records = getMonthRecords(2026, 2)
 * // 返回所有 date 以 '2026-02' 开头的记录
 */
function getMonthRecords(year, month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    return getRecords().filter(r => r.date && r.date.startsWith(prefix))
}

/**
 * 获取指定年份的所有记录
 * @param {number} year - 年份，如 2026
 * @returns {Array} 匹配的记录
 */
function getYearRecords(year) {
    const prefix = `${year}-`
    return getRecords().filter(r => r.date && r.date.startsWith(prefix))
}

module.exports = {
    saveRecord,
    getRecords,
    deleteRecord,
    getMonthRecords,
    getYearRecords
}
