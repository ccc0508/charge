// pages/rank/rank.js
const storage = require('../../utils/storage')

const CATEGORY_MAP = {
    food: { label: '餐饮', icon: '餐', iconColor: '#e74c3c' },
    transport: { label: '交通', icon: '行', iconColor: '#3498db' },
    shopping: { label: '购物', icon: '购', iconColor: '#e67e22' },
    housing: { label: '住房', icon: '房', iconColor: '#1abc9c' },
    entertainment: { label: '娱乐', icon: '乐', iconColor: '#9b59b6' },
    medical: { label: '医疗', icon: '医', iconColor: '#e74c3c' },
    education: { label: '教育', icon: '学', iconColor: '#3498db' },
    other_expense: { label: '其他', icon: '他', iconColor: '#95a5a6' },
    salary: { label: '工资', icon: '薪', iconColor: '#2ecc71' },
    bonus: { label: '奖金', icon: '奖', iconColor: '#f1c40f' },
    investment: { label: '理财', icon: '财', iconColor: '#27ae60' },
    parttime: { label: '兼职', icon: '兼', iconColor: '#16a085' },
    other_income: { label: '其他', icon: '他', iconColor: '#95a5a6' }
}

Page({
    data: {
        currentYear: 0,
        currentMonth: 0,
        expenseRank: [],
        incomeRank: [],
        hasExpense: false,
        hasIncome: false
    },

    onLoad() {
        const now = new Date()
        this.setData({
            currentYear: now.getFullYear(),
            currentMonth: now.getMonth() + 1
        })
    },

    onReady() {
        this.loadData()
    },

    prevMonth() {
        let { currentYear, currentMonth } = this.data
        currentMonth--
        if (currentMonth < 1) { currentMonth = 12; currentYear-- }
        this.setData({ currentYear, currentMonth })
        this.loadData()
    },

    nextMonth() {
        let { currentYear, currentMonth } = this.data
        currentMonth++
        if (currentMonth > 12) { currentMonth = 1; currentYear++ }
        this.setData({ currentYear, currentMonth })
        this.loadData()
    },

    loadData() {
        const { currentYear, currentMonth } = this.data
        const records = storage.getMonthRecords(currentYear, currentMonth)

        const expenseRecords = records.filter(r => r.type === 'expense')
        const incomeRecords = records.filter(r => r.type === 'income')

        this.setData({
            expenseRank: this.buildRank(expenseRecords),
            incomeRank: this.buildRank(incomeRecords),
            hasExpense: expenseRecords.length > 0,
            hasIncome: incomeRecords.length > 0
        })
    },

    buildRank(records) {
        return records
            .slice().sort((a, b) => b.amount - a.amount)
            .slice(0, 10)
            .map((r, i) => {
                const info = CATEGORY_MAP[r.category]
                return {
                    ...r,
                    rank: i + 1,
                    categoryLabel: info ? info.label : r.category,
                    categoryIcon: info ? info.icon : '他',
                    iconColor: info ? info.iconColor : '#95a5a6',
                    amountText: '¥' + r.amount.toFixed(2)
                }
            })
    }
})
