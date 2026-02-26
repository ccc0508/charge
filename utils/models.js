/**
 * 记账小程序 - 数据模型定义
 */

// ==================== 类型常量 ====================

const RECORD_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense'
}

// ==================== 分类常量 ====================

/** 支出分类 */
const EXPENSE_CATEGORIES = [
  { key: 'food',           label: '餐饮', icon: '🍔' },
  { key: 'transport',      label: '交通', icon: '🚌' },
  { key: 'shopping',       label: '购物', icon: '🛒' },
  { key: 'housing',        label: '住房', icon: '🏠' },
  { key: 'entertainment',  label: '娱乐', icon: '🎮' },
  { key: 'medical',        label: '医疗', icon: '💊' },
  { key: 'education',      label: '教育', icon: '📚' },
  { key: 'other_expense',  label: '其他', icon: '📦' }
]

/** 收入分类 */
const INCOME_CATEGORIES = [
  { key: 'salary',         label: '工资', icon: '💰' },
  { key: 'bonus',          label: '奖金', icon: '🎁' },
  { key: 'investment',     label: '投资', icon: '📈' },
  { key: 'parttime',       label: '兼职', icon: '💼' },
  { key: 'other_income',   label: '其他', icon: '📦' }
]

// ==================== 工具函数 ====================

/**
 * 生成唯一 ID（时间戳 + 随机数）
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/**
 * 获取今天的日期字符串
 * @returns {string} 格式 YYYY-MM-DD
 */
function today() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 将金额格式化为两位小数
 * @param {number} amount
 * @returns {number}
 */
function formatAmount(amount) {
  return Math.round(parseFloat(amount) * 100) / 100
}

// ==================== 记录模型 ====================

/**
 * 创建一条记账记录
 * 
 * @param {object} options
 * @param {number} options.amount    - 金额（元）
 * @param {string} options.type      - 类型 'income' | 'expense'
 * @param {string} options.category  - 分类 key，如 'food'、'salary'
 * @param {string} [options.note]    - 备注
 * @param {string} [options.date]    - 日期 'YYYY-MM-DD'，默认今天
 * @returns {object} 记账记录对象
 * 
 * @example
 * const record = createRecord({
 *   amount: 35.5,
 *   type: 'expense',
 *   category: 'food',
 *   note: '午餐',
 *   date: '2026-02-25'
 * })
 * // => {
 * //   id: 'lq1abc123def',
 * //   amount: 35.5,
 * //   type: 'expense',
 * //   category: 'food',
 * //   note: '午餐',
 * //   date: '2026-02-25',
 * //   createdAt: 1740000000000
 * // }
 */
function createRecord({ amount, type, category, note, date }) {
  return {
    id: generateId(),
    amount: formatAmount(amount),
    type: type,
    category: category,
    note: note || '',
    date: date || today(),
    createdAt: Date.now()
  }
}

/**
 * 根据 type 获取对应的分类列表
 * @param {string} type - 'income' | 'expense'
 * @returns {Array} 分类数组
 */
function getCategoriesByType(type) {
  return type === RECORD_TYPES.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

/**
 * 根据分类 key 查找分类信息
 * @param {string} key - 分类 key
 * @param {string} type - 'income' | 'expense'
 * @returns {object|undefined} 分类对象 { key, label, icon }
 */
function getCategoryByKey(key, type) {
  const categories = getCategoriesByType(type)
  return categories.find(c => c.key === key)
}

// ==================== 模块导出 ====================

module.exports = {
  RECORD_TYPES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  createRecord,
  getCategoriesByType,
  getCategoryByKey,
  generateId,
  today,
  formatAmount
}
