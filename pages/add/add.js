// pages/add/add.js
const storage = require('../../utils/storage')

// 支出分类
const expenseCategories = [
    { key: 'food', label: '餐饮', icon: '餐', iconColor: '#e74c3c' },
    { key: 'transport', label: '交通', icon: '行', iconColor: '#3498db' },
    { key: 'shopping', label: '购物', icon: '购', iconColor: '#e67e22' },
    { key: 'entertainment', label: '娱乐', icon: '乐', iconColor: '#9b59b6' },
    { key: 'housing', label: '住房', icon: '房', iconColor: '#1abc9c' },
    { key: 'medical', label: '医疗', icon: '医', iconColor: '#e74c3c' },
    { key: 'education', label: '教育', icon: '学', iconColor: '#3498db' },
    { key: 'other_expense', label: '其他', icon: '他', iconColor: '#95a5a6' }
]

// 收入分类
const incomeCategories = [
    { key: 'salary', label: '工资', icon: '薪', iconColor: '#2ecc71' },
    { key: 'bonus', label: '奖金', icon: '奖', iconColor: '#f1c40f' },
    { key: 'investment', label: '理财', icon: '财', iconColor: '#27ae60' },
    { key: 'parttime', label: '兼职', icon: '兼', iconColor: '#16a085' },
    { key: 'other_income', label: '其他', icon: '他', iconColor: '#95a5a6' }
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
        saving: false,
        isEdit: false,
        editId: ''
    },

    onLoad(options) {
        const today = getToday()
        this.setData({ date: today, dateLabel: '今天' })

        // 编辑模式：从 URL 参数还原记录
        if (options.id) {
            const records = storage.getRecords()
            const record = records.find(r => r.id === options.id)
            if (record) {
                const type = record.type
                const categories = type === 'income' ? incomeCategories : expenseCategories
                const amountStr = String(record.amount)
                this.setData({
                    isEdit: true,
                    editId: record.id,
                    type,
                    categories,
                    selectedCategory: record.category,
                    amount: amountStr,
                    displayAmount: amountStr,
                    note: record.note || '',
                    date: record.date,
                    dateLabel: formatDateLabel(record.date)
                })
                wx.setNavigationBarTitle({ title: '修改记录' })
            }
        }
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
        this.setData({ amount, displayAmount: amount })
    },

    /** 数字键盘 - 删除 */
    onKeyDelete() {
        let { amount } = this.data
        if (amount.length === 0) return

        amount = amount.slice(0, -1)
        this.setData({ amount, displayAmount: amount || '0.00' })
    },

    /** 格式化显示金额 */
    _formatDisplay(val) {
        if (!val || val === '' || val === '.') return '0.00'
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
        const { amount, type, selectedCategory, note, date, saving, isEdit, editId } = this.data

        if (saving) return

        if (!amount || parseFloat(amount) <= 0) {
            wx.showToast({ title: '请输入金额', icon: 'none' })
            return
        }

        this.setData({ saving: true })

        const recordData = {
            amount: parseFloat(amount),
            type,
            category: selectedCategory,
            note,
            date
        }

        if (isEdit) {
            storage.updateRecord(editId, recordData)
        } else {
            storage.saveRecord(recordData)
        }

        wx.showToast({
            title: isEdit ? '修改成功' : '保存成功',
            icon: 'success',
            duration: 800
        })

        setTimeout(() => {
            wx.navigateBack()
        }, 600)
    }
})
