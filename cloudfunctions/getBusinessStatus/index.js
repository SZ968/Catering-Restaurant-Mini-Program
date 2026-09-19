const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 计算并返回当前营业状态（结合总开关与当日时段）
exports.main = async () => {
  try {
    const res = await db.collection('res_business_status').doc('singleton').get()
    const doc = res.data || {}
    const now = new Date()
    const wd = now.getDay() // 0=周日 .. 6=周六
    const today = (doc.dailyHours || []).find((h) => h.weekday === wd)
    let hoursText = ''
    let isOpen = !!doc.isOpen
    if (today && !today.isClosed) {
      hoursText = `今日 ${today.openTime} - ${today.closeTime}`
    } else if (today && today.isClosed) {
      hoursText = '今日休息'
      isOpen = false
    } else {
      hoursText = '营业时间未配置'
    }
    return {
      success: true,
      status: {
        isOpen,
        isOpenRaw: !!doc.isOpen,
        notice: doc.notice || '',
        allowDelivery: !!doc.allowDelivery,
        hoursText,
      },
    }
  } catch (e) {
    return { success: false, message: e.message || '查询失败' }
  }
}
