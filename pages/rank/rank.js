// pages/rank/rank.js
const storage = require('../../utils/storage')

const CATEGORY_MAP = {
    food: { label: '餐饮', icon: '🍔' },
    transport: { label: '交通', icon: '🚌' },
    shopping: { label: '购物', icon: '🛒' },
    housing: { label: '住房', icon: '🏠' },
    entertainment: { label: '娱乐', icon: '🎮' },
    medical: { label: '医疗', icon: '💊' },
    education: { label: '教育', icon: '📚' },
    other_expense: { label: '其他', icon: '📦' },
    salary: { label: '工资', icon: '💰' },
    bonus: { label: '奖金', icon: '🎁' },
    investment: { label: '理财', icon: '📈' },
    parttime: { label: '兼职', icon: '💼' },
    other_income: { label: '其他', icon: '📦' }
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
                    categoryIcon: info ? info.icon : '📦',
                    amountText: '¥' + r.amount.toFixed(2)
                }
            })
    }
})
