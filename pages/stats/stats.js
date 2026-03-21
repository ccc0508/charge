// pages/stats/stats.js
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

const EXPENSE_COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#9b59b6', '#1abc9c', '#3498db', '#34495e', '#95a5a6']
const INCOME_COLORS = ['#2ecc71', '#27ae60', '#1abc9c', '#16a085', '#3498db']

Page({
    data: {
        currentYear: 0,
        currentMonth: 0,
        expenseData: [],
        incomeData: [],
        totalExpense: 0,
        totalIncome: 0,
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

        const expenseData = this.groupByCategory(expenseRecords, EXPENSE_COLORS)
        const incomeData = this.groupByCategory(incomeRecords, INCOME_COLORS)

        const totalExpense = Math.round(expenseData.reduce((s, d) => s + d.total, 0) * 100) / 100
        const totalIncome = Math.round(incomeData.reduce((s, d) => s + d.total, 0) * 100) / 100

        this.setData({
            expenseData, incomeData,
            totalExpense,
            totalIncome,
            hasExpense: expenseData.length > 0,
            hasIncome: incomeData.length > 0
        })

        if (expenseData.length > 0) this.drawPieChart('expenseCanvas', expenseData, totalExpense)
        if (incomeData.length > 0) this.drawPieChart('incomeCanvas', incomeData, totalIncome)
    },

    groupByCategory(records, colors) {
        const map = {}
        let total = 0
        records.forEach(r => {
            if (!map[r.category]) {
                const info = CATEGORY_MAP[r.category]
                map[r.category] = { category: r.category, label: info ? info.label : r.category, icon: info ? info.icon : '📦', total: 0 }
            }
            map[r.category].total += r.amount
            total += r.amount
        })
        return Object.values(map)
            .sort((a, b) => b.total - a.total)
            .map((item, i) => ({
                ...item,
                total: Math.round(item.total * 100) / 100,
                percent: total > 0 ? Math.round(item.total / total * 1000) / 10 : 0,
                color: colors[i % colors.length]
            }))
    },

    drawPieChart(canvasId, data, total) {
        const query = wx.createSelectorQuery()
        query.select(`#${canvasId}`)
            .fields({ node: true, size: true })
            .exec((res) => {
                if (!res[0]) return
                const canvas = res[0].node
                const ctx = canvas.getContext('2d')
                const dpr = wx.getWindowInfo().pixelRatio
                const width = res[0].width
                const height = res[0].height
                canvas.width = width * dpr
                canvas.height = height * dpr
                ctx.scale(dpr, dpr)

                const cx = width / 2, cy = height / 2
                const radius = Math.min(cx, cy) - 10
                const innerRadius = radius * 0.55
                let startAngle = -Math.PI / 2

                data.forEach(item => {
                    const sliceAngle = (item.total / total) * 2 * Math.PI
                    ctx.beginPath()
                    ctx.moveTo(cx + innerRadius * Math.cos(startAngle), cy + innerRadius * Math.sin(startAngle))
                    ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle)
                    ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true)
                    ctx.closePath()
                    ctx.fillStyle = item.color
                    ctx.fill()
                    startAngle += sliceAngle
                })

                ctx.fillStyle = '#333'
                ctx.font = 'bold 16px sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(`¥${total.toFixed(2)}`, cx, cy)
            })
    }
})
