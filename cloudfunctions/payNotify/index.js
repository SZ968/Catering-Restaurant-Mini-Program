const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 微信支付结果回调（云支付 functionName 指向本函数）
// 支付成功后将订单状态更新为「已支付」
exports.main = async (event) => {
  const { outTradeNo, resultCode, returnCode } = event
  try {
    if (returnCode === 'SUCCESS' && resultCode === 'SUCCESS' && outTradeNo) {
      await db
        .collection('res_orders')
        .where({ orderNo: outTradeNo })
        .update({
          data: {
            status: 'paid',
            payStatus: 'paid',
            payTime: Date.now(),
            updateTime: Date.now(),
          },
        })
    }
  } catch (e) {
    console.error('payNotify error', e)
  }
  // 云支付要求返回成功响应以确认回调
  return { errcode: 0, errmsg: 'OK' }
}
