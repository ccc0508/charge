// pages/add/add.js
const storage = require('../../utils/storage')

// 支出分类
const expenseCategories = [
    { key: 'food', label: '餐饮', icon: '🍔' },
    { key: 'transport', label: '交通', icon: '🚌' },
    { key: 'shopping', label: '购物', icon: '🛒' },
    { key: 'entertainment', label: '娱乐', icon: '🎮' },
    { key: 'housing', label: '住房', icon: '🏠' },
    { key: 'medical', label: '医疗', icon: '💊' },
    { key: 'education', label: '教育', icon: '📚' },
    { key: 'other_expense', label: '其他', icon: '📦' }
]

// 收入分类
const incomeCategories = [
    { key: 'salary', label: '工资', icon: '💰' },
    { key: 'bonus', label: '奖金', icon: '🎁' },
    { key: 'investment', label: '理财', icon: '📈' },
    { key: 'parttime', label: '兼职', icon: '💼' },
    { key: 'other_income', label: '其他', icon: '📦' }
]

/**
 * 获取今天的日期字符串 YYYY-MM-DD
 */
function getToday() {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

/**
 * 格式化日期显示（今天/昨天/MM-DD）
 */
function formatDateLabel(dateStr) {
    const today = getToday()
    if (dateStr === today) return '今天'

    const d = new Date()
    d.setDate(d.getDate() - 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    if (dateStr === `${y}-${m}-${day}`) return '昨天'

    return dateStr.slice(5) // MM-DD
}

Page({
    data: {
        type: 'expense',
        categories: expenseCategories,
        selectedCategory: 'food',
        amount: '',
        displayAmount: '0.00',
        note: '',
        date: '',
        dateLabel: '今天',
        saving: false
    },

    onLoad() {
        const today = getToday()
        this.setData({
            date: today,
            dateLabel: '今天'
        })
    },

    /** 切换 收入/支出 Tab */
    onTabChange(e) {
        const type = e.currentTarget.dataset.type
        if (type === this.data.type) return

        const categories = type === 'income' ? incomeCategories : expenseCategories
        this.setData({
            type,
            categories,
            selectedCategory: categories[0].key
        })
    },

    /** 选择分类 */
    onCategoryTap(e) {
        const key = e.currentTarget.dataset.key
        this.setData({ selectedCategory: key })
    },

    /** 数字键盘 - 输入数字/小数点 */
    onKeyTap(e) {
        const val = e.currentTarget.dataset.val
        let { amount } = this.data

        // 小数点处理
        if (val === '.') {
            if (amount.includes('.')) return  // 已有小数点
            if (amount === '') amount = '0'   // 空串补0
        }

        // 限制整数部分不超过7位
        if (val !== '.') {
            const parts = amount.split('.')
            if (!amount.includes('.') && parts[0].length >= 7) return
        }

        // 限制小数最多2位
        if (amount.includes('.')) {
            const decPart = amount.split('.')[1]
            if (val !== '.' && decPart && decPart.length >= 2) return
        }

        // 前导零处理：如果当前是"0"，输入非0数字则替换
        if (amount === '0' && val !== '.' && val !== '0') {
            amount = ''
        }
        // 避免多个前导零
        if (amount === '0' && val === '0') return

        amount += val
        this.setData({
            amount,
            displayAmount: this._formatDisplay(amount)
        })
    },

    /** 数字键盘 - 删除 */
    onKeyDelete() {
        let { amount } = this.data
        if (amount.length === 0) return

        amount = amount.slice(0, -1)
        this.setData({
            amount,
            displayAmount: this._formatDisplay(amount)
        })
    },

    /** 格式化显示金额 */
    _formatDisplay(val) {
        if (!val || val === '' || val === '.') return '0.00'
        // 如果是纯整数，加 .00
        if (!val.includes('.')) {
            return parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }
        // 有小数点，按原样显示
        return val
    },

    /** 备注输入 */
    onNoteInput(e) {
        this.setData({ note: e.detail.value })
    },

    /** 日期选择 */
    onDateChange(e) {
        const date = e.detail.value
        this.setData({
            date,
            dateLabel: formatDateLabel(date)
        })
    },

    /** 保存记录 */
    onSave() {
        const { amount, type, selectedCategory, note, date, saving } = this.data

        if (saving) return

        // 校验金额
        if (!amount || parseFloat(amount) <= 0) {
            wx.showToast({ title: '请输入金额', icon: 'none' })
            return
        }

        this.setData({ saving: true })

        storage.saveRecord({
            amount: parseFloat(amount),
            type,
            category: selectedCategory,
            note,
            date
        })

        wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 1500
        })

        setTimeout(() => {
            wx.navigateBack()
        }, 1500)
    }
})
