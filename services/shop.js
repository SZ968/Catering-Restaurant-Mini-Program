// 店铺信息与营业状态服务
const { getDB, COLLECTIONS } = require('../utils/cloud')

// 读取店铺信息单文档
async function getShopInfo() {
  const db = getDB()
  const res = await db.collection(COLLECTIONS.shopInfo).doc('singleton').get()
  return res.data || {}
}

// 读取并计算营业状态
async function getBusinessStatus() {
  const db = getDB()
  const res = await db.collection(COLLECTIONS.businessStatus).doc('singleton').get()
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
    isOpen,
    notice: doc.notice || '',
    allowDelivery: !!doc.allowDelivery,
    hoursText,
    raw: doc,
  }
}

// 实时监听营业状态（管理端切换即时生效）
function watchBusinessStatus(cb) {
  const db = getDB()
  return db.collection(COLLECTIONS.businessStatus).doc('singleton').watch({
    onChange: (snapshot) => {
      const doc = snapshot.docs && snapshot.docs[0]
      if (doc) cb(doc)
    },
    onError: (e) => console.error('watch business error', e),
  })
}

module.exports = { getShopInfo, getBusinessStatus, watchBusinessStatus }
