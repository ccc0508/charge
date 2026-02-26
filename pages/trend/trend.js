// pages/trend/trend.js
const storage = require('../../utils/storage')

Page({
    data: {
        currentYear: 0,
        yearlyData: [],
        yearlyTotalIncome: 0,
        yearlyTotalExpense: 0,
        yearlyBalance: 0,
        hasYearlyData: false
    },

    onLoad() {
        this.setData({ currentYear: new Date().getFullYear() })
    },

    onReady() {
        this.loadData()
    },

    prevYear() {
        this.setData({ currentYear: this.data.currentYear - 1 })
        this.loadData()
    },

    nextYear() {
        this.setData({ currentYear: this.data.currentYear + 1 })
        this.loadData()
    },

    loadData() {
        const result = this.buildYearlyData(this.data.currentYear)
        this.setData({
            yearlyData: result.data,
            yearlyTotalIncome: result.totalIncome,
            yearlyTotalExpense: result.totalExpense,
            yearlyBalance: result.balance,
            hasYearlyData: result.hasData
        })
        if (result.hasData) {
            this.drawBarChart('yearlyBarCanvas', result.data)
        }
    },

    buildYearlyData(year) {
        const yearRecords = storage.getYearRecords(year)
        const data = []
        let totalIncome = 0, totalExpense = 0

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
        return {
            data, totalIncome, totalExpense,
            balance: Math.round((totalIncome - totalExpense) * 100) / 100,
            hasData: yearRecords.length > 0
        }
    },

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

                const paddingLeft = 10, paddingRight = 10, paddingTop = 40, paddingBottom = 30
                const chartWidth = width - paddingLeft - paddingRight
                const chartHeight = height - paddingTop - paddingBottom

                let maxVal = 0
                yearlyData.forEach(d => { maxVal = Math.max(maxVal, d.income, d.expense) })
                if (maxVal === 0) maxVal = 100
                const niceMax = this._niceNum(maxVal)

                // 网格线
                ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 0.5
                for (let i = 1; i <= 4; i++) {
                    const y = paddingTop + chartHeight - ((niceMax / 4) * i / niceMax) * chartHeight
                    ctx.beginPath(); ctx.moveTo(paddingLeft, y); ctx.lineTo(width - paddingRight, y); ctx.stroke()
                }

                const groupWidth = chartWidth / 12
                const barWidth = groupWidth * 0.32
                const barGap = groupWidth * 0.06

                yearlyData.forEach((d, i) => {
                    const groupX = paddingLeft + i * groupWidth
                    const centerX = groupX + groupWidth / 2

                    // 支出柱
                    const expH = niceMax > 0 ? (d.expense / niceMax) * chartHeight : 0
                    const expX = centerX - barWidth - barGap / 2
                    const expY = paddingTop + chartHeight - expH
                    if (expH > 0) {
                        const g = ctx.createLinearGradient(expX, expY, expX, paddingTop + chartHeight)
                        g.addColorStop(0, '#e74c3c'); g.addColorStop(1, '#f5a0a0')
                        ctx.fillStyle = g; ctx.beginPath()
                        this._roundRect(ctx, expX, expY, barWidth, expH, 4); ctx.fill()
                        ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 9px sans-serif'
                        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
                        ctx.fillText(this._formatBarLabel(d.expense), expX + barWidth / 2, expY - 4)
                    }

                    // 收入柱
                    const incH = niceMax > 0 ? (d.income / niceMax) * chartHeight : 0
                    const incX = centerX + barGap / 2
                    const incY = paddingTop + chartHeight - incH
                    if (incH > 0) {
                        const g = ctx.createLinearGradient(incX, incY, incX, paddingTop + chartHeight)
                        g.addColorStop(0, '#2ecc71'); g.addColorStop(1, '#a0f0c0')
                        ctx.fillStyle = g; ctx.beginPath()
                        this._roundRect(ctx, incX, incY, barWidth, incH, 4); ctx.fill()
                        ctx.fillStyle = '#2ecc71'; ctx.font = 'bold 9px sans-serif'
                        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
                        ctx.fillText(this._formatBarLabel(d.income), incX + barWidth / 2, incY - 4)
                    }

                    ctx.fillStyle = '#999'; ctx.font = '11px sans-serif'
                    ctx.textAlign = 'center'; ctx.textBaseline = 'top'
                    ctx.fillText(`${d.month}月`, centerX, paddingTop + chartHeight + 8)
                })

                ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1; ctx.beginPath()
                ctx.moveTo(paddingLeft, paddingTop + chartHeight)
                ctx.lineTo(width - paddingRight, paddingTop + chartHeight); ctx.stroke()
            })
    },

    _roundRect(ctx, x, y, w, h, r) {
        if (h < r * 2) r = h / 2; if (w < r * 2) r = w / 2
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y)
        ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h)
        ctx.lineTo(x, y + h); ctx.lineTo(x, y + r)
        ctx.arcTo(x, y, x + r, y, r); ctx.closePath()
    },

    _niceNum(val) {
        const exp = Math.floor(Math.log10(val))
        const frac = val / Math.pow(10, exp)
        let n; if (frac <= 1) n = 1; else if (frac <= 2) n = 2; else if (frac <= 5) n = 5; else n = 10
        return n * Math.pow(10, exp)
    },

    _formatBarLabel(val) {
        if (val >= 10000) return (val / 10000).toFixed(1) + 'w'
        if (val >= 1000) return (val / 1000).toFixed(1) + 'k'
        if (val === 0) return ''
        return val.toFixed(0)
    }
})
