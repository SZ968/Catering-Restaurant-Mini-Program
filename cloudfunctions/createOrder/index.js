const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// —— 云支付配置 ——
// 在 CloudBase 控制台「云支付」中开通微信支付后，填写以下信息：
//   subMchId: 微信支付商户号（或云支付子商户号）
//   envId:    当前云开发环境 ID（与 app.js 中 ENV_ID 一致）
//   functionName: 支付成功回调云函数名（见 payNotify）
// 注：subMchId 仍为占位符时，视为未开通支付，订单将走「到店付」。
const PAY_CONFIG = {
  subMchId: 'YOUR_SUB_MCH_ID',
  envId: 'cloud1-d7gbq15ne65c36346',
  functionName: 'payNotify',
}

// 是否已真正配置微信支付（占位符视为未开通）
function isPayEnabled() {
  return !!(PAY_CONFIG.subMchId && PAY_CONFIG.subMchId !== 'YOUR_SUB_MCH_ID')
}

// 创建订单 + 调起微信支付（支持重新支付）
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()

  // —— 重新支付已有订单 ——
  if (event.repay && event.orderId) {
    const orderRes = await db.collection('res_orders').doc(event.orderId).get()
    const order = orderRes.data
    if (!order) return { success: false, message: '订单不存在' }
    // 到店付订单无需重新支付，直接视为成功
    if (order.payMethod === 'offline') {
      return { success: true, orderId: order._id, payParams: null }
    }
    if (order.status !== 'unpaid') return { success: false, message: '订单状态异常' }
    try {
      const payParams = await unifiedOrder(order, OPENID)
      return { success: true, orderId: order._id, payParams }
    } catch (e) {
      return { success: false, message: '支付唤起失败：' + (e.message || e) }
    }
  }

  // —— 新建订单 ——
  const {
    items,
    type,
    remark,
    address,
    tableNo,
    pickupTime,
    reserveTime,
    personCount,
    payLater,
  } = event
  if (!items || !items.length) return { success: false, message: '购物车为空' }
  const totalAmount = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)
  if (totalAmount <= 0) return { success: false, message: '金额异常' }

  const orderNo = genOrderNo()
  const now = Date.now()
  const usePay = !payLater && isPayEnabled()

  const order = {
    orderNo,
    openid: OPENID,
    type,
    remark: remark || '',
    items,
    totalAmount,
    status: usePay ? 'unpaid' : 'paid',
    payStatus: usePay ? 'pending' : 'offline',
    payMethod: usePay ? 'wechat' : 'offline',
    tableNo: tableNo || '',
    pickupTime: pickupTime || '',
    reserveTime: reserveTime || '',
    personCount: personCount || 0,
    address: address || null,
    createTime: now,
    updateTime: now,
  }
  const addRes = await db.collection('res_orders').add({ data: order })
  const orderId = addRes._id

  // 到店付：直接返回，无需唤起微信支付
  if (!usePay) {
    return { success: true, orderId, payParams: null }
  }

  try {
    const payParams = await unifiedOrder(Object.assign({}, order, { orderNo }), OPENID)
    return { success: true, orderId, payParams }
  } catch (e) {
    // 保留 unpaid 订单，允许顾客稍后在「我的订单」重新支付
    return { success: false, message: '支付唤起失败：' + (e.message || e), orderId }
  }
}

function genOrderNo() {
  const d = new Date()
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  const r = Math.floor(Math.random() * 9000) + 1000
  return `MK${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${r}`
}

async function unifiedOrder(order, openid) {
  const res = await cloud.cloudPay.unifiedOrder({
    body: '猴王大虾订单',
    outTradeNo: order.orderNo,
    spbillCreateIp: '127.0.0.1',
    subMchId: PAY_CONFIG.subMchId,
    totalFee: Math.round(order.totalAmount * 100),
    envId: PAY_CONFIG.envId,
    functionName: PAY_CONFIG.functionName,
    nonceStr: Math.random().toString(36).slice(2, 18),
    tradeType: 'JSAPI',
    openid,
  })
  return {
    timeStamp: String(res.timeStamp),
    nonceStr: res.nonceStr,
    package: res.package,
    signType: res.signType,
    paySign: res.paySign,
  }
}
