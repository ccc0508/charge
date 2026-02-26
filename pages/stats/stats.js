// pages/stats/stats.js
const storage = require('../../utils/storage')

// 分类映射
const CATEGORY_MAP = {
    food: { label: '餐饮', icon: '🍔' },
    transport: { label: '交通', icon: '🚌' },
    shopping: { label: '购物', icon: '🛒' },
    entertainment: { label: '娱乐', icon: '🎮' },
    medical: { label: '医疗', icon: '💊' },
    other_expense: { label: '其他', icon: '📦' },
    salary: { label: '工资', icon: '💰' },
    bonus: { label: '奖金', icon: '🎁' },
    investment: { label: '理财', icon: '📈' },
    other_income: { label: '其他', icon: '📦' }
}

// 配色方案
const EXPENSE_COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#9b59b6', '#1abc9c', '#3498db', '#34495e', '#95a5a6']
const INCOME_COLORS = ['#2ecc71', '#27ae60', '#1abc9c', '#16a085', '#3498db']

Page({
    data: {
        currentYear: 0,
        currentMonth: 0,
        expenseData: [],   // [{ label, icon, total, percent, color }]
        incomeData: [],
        totalExpense: 0,
        totalIncome: 0,
        expenseRank: [],   // 支出排行榜（单笔记录）
        incomeRank: [],    // 收入排行榜（单笔记录）
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

    /** 切换到上一个月 */
    prevMonth() {
        let { currentYear, currentMonth } = this.data
        currentMonth--
        if (currentMonth < 1) {
            currentMonth = 12
            currentYear--
        }
        this.setData({ currentYear, currentMonth })
        this.loadData()
    },

    /** 切换到下一个月 */
    nextMonth() {
        let { currentYear, currentMonth } = this.data
        currentMonth++
        if (currentMonth > 12) {
            currentMonth = 1
            currentYear++
        }
        this.setData({ currentYear, currentMonth })
        this.loadData()
    },

    /** 加载数据并绘制图表 */
    loadData() {
        const { currentYear, currentMonth } = this.data
        const records = storage.getMonthRecords(currentYear, currentMonth)

        const expenseRecords = records.filter(r => r.type === 'expense')
        const incomeRecords = records.filter(r => r.type === 'income')

        const expenseData = this.groupByCategory(expenseRecords, EXPENSE_COLORS)
        const incomeData = this.groupByCategory(incomeRecords, INCOME_COLORS)

        const totalExpense = expenseData.reduce((s, d) => s + d.total, 0)
        const totalIncome = incomeData.reduce((s, d) => s + d.total, 0)

        // 排行榜：按单笔金额降序
        const expenseRank = this.buildRank(expenseRecords)
        const incomeRank = this.buildRank(incomeRecords)

        this.setData({
            expenseData,
            incomeData,
            totalExpense: Math.round(totalExpense * 100) / 100,
            totalIncome: Math.round(totalIncome * 100) / 100,
            expenseRank,
            incomeRank,
            hasExpense: expenseData.length > 0,
            hasIncome: incomeData.length > 0
        })

        // 绘制扇形图
        if (expenseData.length > 0) {
            this.drawPieChart('expenseCanvas', expenseData, totalExpense)
        }
        if (incomeData.length > 0) {
            this.drawPieChart('incomeCanvas', incomeData, totalIncome)
        }
    },

    /** 按分类汇总并排序 */
    groupByCategory(records, colors) {
        const map = {}
        let total = 0

        records.forEach(r => {
            if (!map[r.category]) {
                const info = CATEGORY_MAP[r.category]
                map[r.category] = {
                    category: r.category,
                    label: info ? info.label : r.category,
                    icon: info ? info.icon : '📦',
                    total: 0
                }
            }
            map[r.category].total += r.amount
            total += r.amount
        })

        // 按金额降序排列，分配颜色和百分比
        return Object.values(map)
            .sort((a, b) => b.total - a.total)
            .map((item, i) => ({
                ...item,
                total: Math.round(item.total * 100) / 100,
                percent: total > 0 ? Math.round(item.total / total * 1000) / 10 : 0,
                color: colors[i % colors.length]
            }))
    },

    /** 使用 Canvas 2D 绘制扇形图 */
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

                const cx = width / 2
                const cy = height / 2
                const radius = Math.min(cx, cy) - 10
                const innerRadius = radius * 0.55 // 环形图

                let startAngle = -Math.PI / 2

                // 绘制扇区
                data.forEach(item => {
                    const sliceAngle = (item.total / total) * 2 * Math.PI

                    ctx.beginPath()
                    ctx.moveTo(
                        cx + innerRadius * Math.cos(startAngle),
                        cy + innerRadius * Math.sin(startAngle)
                    )
                    ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle)
                    ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true)
                    ctx.closePath()
                    ctx.fillStyle = item.color
                    ctx.fill()

                    startAngle += sliceAngle
                })

                // 中心文字
                ctx.fillStyle = '#333'
                ctx.font = 'bold 16px sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(`¥${total}`, cx, cy)
            })
    },

    /** 构建排行榜（单笔记录按金额降序，取前10） */
    buildRank(records) {
        return records
            .slice()
            .sort((a, b) => b.amount - a.amount)
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
