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
        hasIncome: false,
        yearlyData: [],    // [{ month, income, expense }] 1-12月
        yearlyTotalIncome: 0,
        yearlyTotalExpense: 0,
        yearlyBalance: 0,
        hasYearlyData: false
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

        // 年度数据
        const yearlyResult = this.buildYearlyData(currentYear)

        this.setData({
            expenseData,
            incomeData,
            totalExpense: Math.round(totalExpense * 100) / 100,
            totalIncome: Math.round(totalIncome * 100) / 100,
            expenseRank,
            incomeRank,
            hasExpense: expenseData.length > 0,
            hasIncome: incomeData.length > 0,
            yearlyData: yearlyResult.data,
            yearlyTotalIncome: yearlyResult.totalIncome,
            yearlyTotalExpense: yearlyResult.totalExpense,
            yearlyBalance: yearlyResult.balance,
            hasYearlyData: yearlyResult.hasData
        })

        // 绘制扇形图
        if (expenseData.length > 0) {
            this.drawPieChart('expenseCanvas', expenseData, totalExpense)
        }
        if (incomeData.length > 0) {
            this.drawPieChart('incomeCanvas', incomeData, totalIncome)
        }

        // 绘制年度柱形图
        if (yearlyResult.hasData) {
            this.drawBarChart('yearlyBarCanvas', yearlyResult.data)
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
    },

    /** 构建年度月度数据 */
    buildYearlyData(year) {
        const yearRecords = storage.getYearRecords(year)
        const data = []
        let totalIncome = 0
        let totalExpense = 0

        for (let m = 1; m <= 12; m++) {
            const prefix = `${year}-${String(m).padStart(2, '0')}`
            const monthRecords = yearRecords.filter(r => r.date.startsWith(prefix))
            let income = 0, expense = 0
            monthRecords.forEach(r => {
                if (r.type === 'income') income += r.amount
                else expense += r.amount
            })
            income = Math.round(income * 100) / 100
            expense = Math.round(expense * 100) / 100
            totalIncome += income
            totalExpense += expense
            data.push({ month: m, income, expense })
        }

        totalIncome = Math.round(totalIncome * 100) / 100
        totalExpense = Math.round(totalExpense * 100) / 100
        const balance = Math.round((totalIncome - totalExpense) * 100) / 100
        const hasData = yearRecords.length > 0

        return { data, totalIncome, totalExpense, balance, hasData }
    },

    /** 绘制年度收支柱形图（可滚动宽画布） */
    drawBarChart(canvasId, yearlyData) {
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

                // 布局参数
                const paddingLeft = 10
                const paddingRight = 10
                const paddingTop = 40   // 留空间给柱顶金额文字
                const paddingBottom = 30
                const chartWidth = width - paddingLeft - paddingRight
                const chartHeight = height - paddingTop - paddingBottom

                // 求最大值
                let maxVal = 0
                yearlyData.forEach(d => {
                    maxVal = Math.max(maxVal, d.income, d.expense)
                })
                if (maxVal === 0) maxVal = 100
                const niceMax = this._niceNum(maxVal)

                // 绘制背景网格线（浅色虚线）
                const gridCount = 4
                ctx.strokeStyle = '#f0f0f0'
                ctx.lineWidth = 0.5
                for (let i = 1; i <= gridCount; i++) {
                    const val = (niceMax / gridCount) * i
                    const y = paddingTop + chartHeight - (val / niceMax) * chartHeight
                    ctx.beginPath()
                    ctx.moveTo(paddingLeft, y)
                    ctx.lineTo(width - paddingRight, y)
                    ctx.stroke()
                }

                // 绘制柱子
                const groupWidth = chartWidth / 12
                const barWidth = groupWidth * 0.32
                const barGap = groupWidth * 0.06

                yearlyData.forEach((d, i) => {
                    const groupX = paddingLeft + i * groupWidth
                    const centerX = groupX + groupWidth / 2

                    // === 支出柱（红色）===
                    const expenseH = niceMax > 0 ? (d.expense / niceMax) * chartHeight : 0
                    const expenseX = centerX - barWidth - barGap / 2
                    const expenseY = paddingTop + chartHeight - expenseH

                    if (expenseH > 0) {
                        const expGrad = ctx.createLinearGradient(expenseX, expenseY, expenseX, paddingTop + chartHeight)
                        expGrad.addColorStop(0, '#e74c3c')
                        expGrad.addColorStop(1, '#f5a0a0')
                        ctx.fillStyle = expGrad
                        ctx.beginPath()
                        this._roundRect(ctx, expenseX, expenseY, barWidth, expenseH, 4)
                        ctx.fill()

                        // 柱顶金额
                        ctx.fillStyle = '#e74c3c'
                        ctx.font = 'bold 9px sans-serif'
                        ctx.textAlign = 'center'
                        ctx.textBaseline = 'bottom'
                        ctx.fillText(this._formatBarLabel(d.expense), expenseX + barWidth / 2, expenseY - 4)
                    }

                    // === 收入柱（绿色）===
                    const incomeH = niceMax > 0 ? (d.income / niceMax) * chartHeight : 0
                    const incomeX = centerX + barGap / 2
                    const incomeY = paddingTop + chartHeight - incomeH

                    if (incomeH > 0) {
                        const incGrad = ctx.createLinearGradient(incomeX, incomeY, incomeX, paddingTop + chartHeight)
                        incGrad.addColorStop(0, '#2ecc71')
                        incGrad.addColorStop(1, '#a0f0c0')
                        ctx.fillStyle = incGrad
                        ctx.beginPath()
                        this._roundRect(ctx, incomeX, incomeY, barWidth, incomeH, 4)
                        ctx.fill()

                        // 柱顶金额
                        ctx.fillStyle = '#2ecc71'
                        ctx.font = 'bold 9px sans-serif'
                        ctx.textAlign = 'center'
                        ctx.textBaseline = 'bottom'
                        ctx.fillText(this._formatBarLabel(d.income), incomeX + barWidth / 2, incomeY - 4)
                    }

                    // X 轴月份标签
                    ctx.fillStyle = '#999'
                    ctx.font = '11px sans-serif'
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'top'
                    ctx.fillText(`${d.month}月`, centerX, paddingTop + chartHeight + 8)
                })

                // X 轴线
                ctx.strokeStyle = '#e0e0e0'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(paddingLeft, paddingTop + chartHeight)
                ctx.lineTo(width - paddingRight, paddingTop + chartHeight)
                ctx.stroke()
            })
    },

    /** 绘制圆角矩形路径 */
    _roundRect(ctx, x, y, w, h, r) {
        if (h < r * 2) r = h / 2
        if (w < r * 2) r = w / 2
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.arcTo(x + w, y, x + w, y + r, r)
        ctx.lineTo(x + w, y + h)
        ctx.lineTo(x, y + h)
        ctx.lineTo(x, y + r)
        ctx.arcTo(x, y, x + r, y, r)
        ctx.closePath()
    },

    /** 将数值取整到好看的刻度 */
    _niceNum(val) {
        const exp = Math.floor(Math.log10(val))
        const frac = val / Math.pow(10, exp)
        let nice
        if (frac <= 1) nice = 1
        else if (frac <= 2) nice = 2
        else if (frac <= 5) nice = 5
        else nice = 10
        return nice * Math.pow(10, exp)
    },

    /** 格式化 Y 轴标签 */
    _formatAxisLabel(val) {
        if (val >= 10000) return (val / 10000).toFixed(val % 10000 === 0 ? 0 : 1) + 'w'
        if (val >= 1000) return (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k'
        return String(Math.round(val))
    },

    /** 格式化柱顶金额标签 */
    _formatBarLabel(val) {
        if (val >= 10000) return (val / 10000).toFixed(1) + 'w'
        if (val >= 1000) return (val / 1000).toFixed(1) + 'k'
        if (val === 0) return ''
        return val.toFixed(0)
    }
})
