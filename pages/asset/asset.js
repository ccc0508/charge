// pages/asset/asset.js
const storage = require('../../utils/storage')

Page({
    data: {
        initial: 0,
        totalIncome: 0,
        totalExpense: 0,
        net: 0,
        inputAmount: '',
        editing: false
    },

    onShow() {
        this.loadAsset()
    },

    loadAsset() {
        const { initial, totalIncome, totalExpense, net } = storage.getTotalAsset()
        this.setData({
            initial,
            totalIncome,
            totalExpense,
            net,
            inputAmount: initial ? String(initial) : ''
        })
    },

    /** 点击编辑初始资产 */
    onEdit() {
        this.setData({ editing: true })
    },

    /** 初始资产输入 */
    onAmountInput(e) {
        let value = e.detail.value
        // 允许负号（负债）
        const isNeg = value.startsWith('-')
        value = value.replace(/[^\d.]/g, '')
        const parts = value.split('.')
        if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('')
        if (parts.length === 2 && parts[1].length > 2) value = parts[0] + '.' + parts[1].slice(0, 2)
        if (isNeg) value = '-' + value
        this.setData({ inputAmount: value })
        return value
    },

    /** 保存初始资产 */
    onSave() {
        const val = parseFloat(this.data.inputAmount) || 0
        storage.setInitialAsset(val)
        this.setData({ editing: false })
        this.loadAsset()
        wx.showToast({ title: '已保存', icon: 'success' })
    },

    /** 取消编辑 */
    onCancel() {
        this.setData({
            editing: false,
            inputAmount: this.data.initial ? String(this.data.initial) : ''
        })
    }
})
