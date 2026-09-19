// ============================================================
// 通用工具函数
// ============================================================

function formatPrice(n) {
  return Number(n || 0).toFixed(2)
}

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

// 时间戳 -> YYYY-MM-DD HH:mm
function formatTime(ts) {
  if (!ts) return ''
  const d = ts instanceof Date ? ts : new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 生成订单号 MK + 时间 + 随机
function genOrderNo() {
  const d = new Date()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `MK${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${rand}`
}

// 调起微信支付（payParams 为空时视为到店付，直接放行）
function requestPayment(payParams) {
  if (!payParams) return Promise.resolve(null)
  return new Promise((resolve, reject) => {
    wx.requestPayment({
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.package,
      signType: payParams.signType,
      paySign: payParams.paySign,
      success: (res) => resolve(res),
      fail: (err) => reject(err),
    })
  })
}

// 拨打电话
function makePhoneCall(phone) {
  wx.makePhoneCall({ phoneNumber: String(phone) })
}

module.exports = { formatPrice, formatTime, genOrderNo, requestPayment, makePhoneCall }
