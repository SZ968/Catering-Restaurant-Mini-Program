Component({
  properties: {
    phones: {
      type: Array,
      value: [],
    },
    // 悬浮位置：left（左下角，默认）/ right（右下角）
    align: {
      type: String,
      value: 'left',
    },
  },
  methods: {
    onCall(e) {
      const phone = e.currentTarget.dataset.phone
      if (!phone) return
      wx.makePhoneCall({ phoneNumber: String(phone) })
    },
  },
})
