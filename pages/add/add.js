// pages/add/add.js
const storage = require('../../utils/storage')

// 支出分类
const expenseCategories = [
    { key: 'food', label: '餐饮', icon: '🍔' },
    { key: 'transport', label: '交通', icon: '🚌' },
    { key: 'shopping', label: '购物', icon: '🛒' },
    { key: 'entertainment', label: '娱乐', icon: '🎮' },
    { key: 'medical', label: '医疗', icon: '💊' },
    { key: 'other_expense', label: '其他', icon: '📦' }
]

// 收入分类
const incomeCategories = [
    { key: 'salary', label: '工资', icon: '💰' },
    { key: 'bonus', label: '奖金', icon: '🎁' },
    { key: 'investment', label: '理财', icon: '📈' },
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

Page({
    data: {
        type: 'expense',               // 当前类型
        categories: expenseCategories,  // 当前分类列表
        selectedCategory: 'food',      // 选中的分类 key
        amount: '',                    // 金额
        note: '',                      // 备注
        date: '',                      // 日期
        saving: false                  // 防止重复提交
    },

    onLoad() {
        this.setData({ date: getToday() })
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

    /** 金额输入 */
    onAmountInput(e) {
        let value = e.detail.value
        // 限制只能输入数字和一个小数点，最多两位小数
        value = value.replace(/[^\d.]/g, '')
        // 只保留第一个小数点
        const parts = value.split('.')
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('')
        }
        // 小数最多两位
        if (parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + '.' + parts[1].slice(0, 2)
        }
        this.setData({ amount: value })
        return value
    },

    /** 备注输入 */
    onNoteInput(e) {
        this.setData({ note: e.detail.value })
    },

    /** 日期选择 */
    onDateChange(e) {
        this.setData({ date: e.detail.value })
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
