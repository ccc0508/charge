/**
 * 记账小程序 - 数据存储管理
 * 基于 wx.getStorageSync / wx.setStorageSync 实现本地持久化
 */

const { createRecord } = require('./models')

const STORAGE_KEY = 'charge_records'

// ==================== 基础读写 ====================

/**
 * 从本地存储读取所有记录
 * @returns {Array} 记录数组
 */
function getAllRecords() {
    return wx.getStorageSync(STORAGE_KEY) || []
}

/**
 * 将记录数组写入本地存储
 * @param {Array} records
 */
function saveAllRecords(records) {
    wx.setStorageSync(STORAGE_KEY, records)
}

// ==================== 增删改 ====================

/**
 * 新增一条记账记录
 * @param {object} data - { amount, type, category, note?, date? }
 * @returns {object} 新创建的记录
 */
function addRecord(data) {
    const records = getAllRecords()
    const record = createRecord(data)
    records.unshift(record) // 最新的放在最前面
    saveAllRecords(records)
    return record
}

/**
 * 删除一条记账记录
 * @param {string} id - 记录 ID
 * @returns {boolean} 是否删除成功
 */
function deleteRecord(id) {
    const records = getAllRecords()
    const index = records.findIndex(r => r.id === id)
    if (index === -1) return false
    records.splice(index, 1)
    saveAllRecords(records)
    return true
}

/**
 * 更新一条记账记录
 * @param {string} id - 记录 ID
 * @param {object} data - 要更新的字段
 * @returns {object|null} 更新后的记录，未找到则返回 null
 */
function updateRecord(id, data) {
    const records = getAllRecords()
    const index = records.findIndex(r => r.id === id)
    if (index === -1) return null
    records[index] = { ...records[index], ...data }
    saveAllRecords(records)
    return records[index]
}

// ==================== 查询 ====================

/**
 * 按日期查询记录
 * @param {string} date - 'YYYY-MM-DD'
 * @returns {Array} 匹配的记录
 */
function getRecordsByDate(date) {
    return getAllRecords().filter(r => r.date === date)
}

/**
 * 按月份查询记录
 * @param {number} year  - 年份，如 2026
 * @param {number} month - 月份 1-12
 * @returns {Array} 匹配的记录
 */
function getRecordsByMonth(year, month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    return getAllRecords().filter(r => r.date.startsWith(prefix))
}

// ==================== 统计 ====================

/**
 * 计算一组记录的收支汇总
 * @param {Array} records - 记录数组
 * @returns {object} { income: number, expense: number, balance: number }
 * 
 * @example
 * const monthRecords = getRecordsByMonth(2026, 2)
 * const summary = getSummary(monthRecords)
 * // => { income: 8000, expense: 3500, balance: 4500 }
 */
function getSummary(records) {
    let income = 0
    let expense = 0

    records.forEach(r => {
        if (r.type === 'income') {
            income += r.amount
        } else {
            expense += r.amount
        }
    })

    // 修正浮点精度
    income = Math.round(income * 100) / 100
    expense = Math.round(expense * 100) / 100
    const balance = Math.round((income - expense) * 100) / 100

    return { income, expense, balance }
}

/**
 * 按分类汇总金额（用于图表/统计页面）
 * @param {Array} records - 记录数组
 * @param {string} type - 'income' | 'expense'
 * @returns {Array} [{ category, label, icon, total }]
 */
function getSummaryByCategory(records, type) {
    const { getCategoryByKey } = require('./models')
    const filtered = records.filter(r => r.type === type)
    const map = {}

    filtered.forEach(r => {
        if (!map[r.category]) {
            const info = getCategoryByKey(r.category, type)
            map[r.category] = {
                category: r.category,
                label: info ? info.label : r.category,
                icon: info ? info.icon : '📦',
                total: 0
            }
        }
        map[r.category].total += r.amount
    })

    // 按金额降序排列
    return Object.values(map)
        .map(item => ({
            ...item,
            total: Math.round(item.total * 100) / 100
        }))
        .sort((a, b) => b.total - a.total)
}

// ==================== 模块导出 ====================

module.exports = {
    getAllRecords,
    addRecord,
    deleteRecord,
    updateRecord,
    getRecordsByDate,
    getRecordsByMonth,
    getSummary,
    getSummaryByCategory
}
