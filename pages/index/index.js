// pages/index/index.js
const storage = require('../../utils/storage')

// 分类映射（用于显示图标和名称）
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

Page({
  data: {
    summary: { income: 0, expense: 0, balance: 0 },
    groupedRecords: [], // [{ date, dateLabel, records: [] }]
    currentYear: 0,
    currentMonth: 0,
    isEmpty: true
  },

  onLoad() {
    const now = new Date()
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    })
  },

  onShow() {
    this.loadData()
  },

  /** 下拉刷新 */
  onPullDownRefresh() {
    this.loadData()
    wx.stopPullDownRefresh()
  },

  /** 加载当月数据 */
  loadData() {
    const { currentYear, currentMonth } = this.data
    const records = storage.getMonthRecords(currentYear, currentMonth)

    // 计算汇总
    let income = 0, expense = 0
    records.forEach(r => {
      if (r.type === 'income') income += r.amount
      else expense += r.amount
    })
    income = Math.round(income * 100) / 100
    expense = Math.round(expense * 100) / 100
    const summary = { income, expense, balance: Math.round((income - expense) * 100) / 100 }

    const groupedRecords = this.groupByDate(records)

    this.setData({
      summary,
      groupedRecords,
      isEmpty: records.length === 0
    })
  },

  /** 按日期分组 */
  groupByDate(records) {
    // 按日期降序排列
    const sorted = records.slice().sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return b.createdAt - a.createdAt
    })

    const groups = []
    let currentDate = ''
    let currentGroup = null

    sorted.forEach(record => {
      // 附加分类信息
      const catInfo = CATEGORY_MAP[record.category]
      const enriched = {
        ...record,
        categoryLabel: catInfo ? catInfo.label : record.category,
        categoryIcon: catInfo ? catInfo.icon : '📦',
        isIncome: record.type === 'income',
        amountText: record.type === 'income'
          ? '+' + record.amount.toFixed(2)
          : '-' + record.amount.toFixed(2)
      }

      if (record.date !== currentDate) {
        currentDate = record.date
        currentGroup = {
          date: record.date,
          dateLabel: this.formatDateLabel(record.date),
          records: []
        }
        groups.push(currentGroup)
      }
      currentGroup.records.push(enriched)
    })

    return groups
  },

  /** 日期格式化显示 */
  formatDateLabel(dateStr) {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    if (dateStr === todayStr) return '今天'

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    if (dateStr === yStr) return '昨天'

    // MM月DD日 星期X
    const d = new Date(dateStr)
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const month = d.getMonth() + 1
    const day = d.getDate()
    const weekDay = weekDays[d.getDay()]
    return `${month}月${day}日 星期${weekDay}`
  },

  /** 跳转到添加页面 */
  goToAdd() {
    wx.navigateTo({
      url: '/pages/add/add'
    })
  },

  /** 跳转到统计页面 */
  goToStats() {
    wx.navigateTo({
      url: '/pages/stats/stats'
    })
  },

  /** 触摸开始 */
  onTouchStart(e) {
    this._touchStartX = e.touches[0].clientX
    this._touchStartY = e.touches[0].clientY
    this._swiping = false
  },

  /** 触摸移动 — 左滑露出删除按钮 */
  onTouchMove(e) {
    const deltaX = e.touches[0].clientX - this._touchStartX
    const deltaY = e.touches[0].clientY - this._touchStartY

    // 水平滑动幅度大于垂直才算左滑
    if (Math.abs(deltaX) < Math.abs(deltaY)) return
    this._swiping = true

    const { id } = e.currentTarget.dataset
    // 限制在 -65 ~ 0 之间
    const offset = Math.max(-65, Math.min(0, deltaX))
    this._updateSwipeOffset(id, offset)
  },

  /** 触摸结束 — 决定打开/关闭 */
  onTouchEnd(e) {
    if (!this._swiping) return
    const deltaX = e.changedTouches[0].clientX - this._touchStartX
    const { id } = e.currentTarget.dataset
    // 左滑超过 30px 就打开，否则关闭
    const offset = deltaX < -30 ? -65 : 0
    this._updateSwipeOffset(id, offset)
  },

  /** 更新指定记录的滑动偏移量 */
  _updateSwipeOffset(id, offset) {
    const groupedRecords = this.data.groupedRecords.map(group => ({
      ...group,
      records: group.records.map(r => ({
        ...r,
        swipeOffset: r.id === id ? offset : 0
      }))
    }))
    this.setData({ groupedRecords })
  },

  /** 点击删除按钮 */
  onDeleteRecord(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          storage.deleteRecord(id)
          this.loadData()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  }
})
