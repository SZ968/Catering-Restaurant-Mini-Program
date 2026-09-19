// 菜单 / 菜品服务
const { getDB, COLLECTIONS } = require('../utils/cloud')

// 分类列表（启用中）
async function getCategories() {
  const db = getDB()
  const res = await db
    .collection(COLLECTIONS.categories)
    .where({ isActive: true })
    .orderBy('sort', 'asc')
    .limit(100)
    .get()
  return res.data
}

// 在售菜品（可按分类过滤）。注意：云开发 get 默认仅返回 20 条，必须显式 limit
async function getDishes(categoryId) {
  const db = getDB()
  const where = { status: 'on' }
  if (categoryId) where.categoryId = categoryId
  const res = await db
    .collection(COLLECTIONS.dishes)
    .where(where)
    .orderBy('sort', 'asc')
    .limit(1000)
    .get()
  return res.data
}

// 单个菜品
async function getDish(id) {
  const db = getDB()
  const res = await db.collection(COLLECTIONS.dishes).doc(id).get()
  return res.data
}

// 实时监听在售菜品（下架/售罄即时同步）
function watchDishes(cb) {
  const db = getDB()
  return db
    .collection(COLLECTIONS.dishes)
    .where({ status: 'on' })
    .watch({
      onChange: (snapshot) => cb(snapshot),
      onError: (e) => console.error('watch dishes error', e),
    })
}

module.exports = { getCategories, getDishes, getDish, watchDishes }
