// ============================================================
// 购物车本地存储 + 简单发布订阅
// 购物车保存在本地 storage，结算时再提交云端订单
// ============================================================

const CART_KEY = 'mks_cart'

let listeners = []

function emit() {
  const list = getCart()
  listeners.forEach((fn) => {
    try { fn(list) } catch (e) { /* 忽略单个订阅者异常 */ }
  })
}

// 订阅购物车变化，返回取消订阅函数
function subscribe(fn) {
  listeners.push(fn)
  return () => { listeners = listeners.filter((f) => f !== fn) }
}

function getCart() {
  return wx.getStorageSync(CART_KEY) || []
}

function saveCart(list) {
  wx.setStorageSync(CART_KEY, list)
  emit()
}

function makeKey(dishId, spec) {
  return `${dishId}::${spec || ''}`
}

function addItem(dish, quantity, spec, note) {
  const list = getCart()
  const key = makeKey(dish._id, spec)
  const exist = list.find((i) => i.key === key)
  if (exist) {
    exist.quantity += quantity
    if (note) exist.note = note
  } else {
    list.push({
      key,
      dishId: dish._id,
      name: dish.name,
      price: dish.price,
      image: dish.image,
      spec: spec || '',
      note: note || '',
      quantity,
    })
  }
  saveCart(list)
  return list
}

function updateQuantity(key, quantity) {
  let list = getCart()
  if (quantity <= 0) {
    list = list.filter((i) => i.key !== key)
  } else {
    list = list.map((i) => (i.key === key ? Object.assign({}, i, { quantity }) : i))
  }
  saveCart(list)
  return list
}

function updateNote(key, note) {
  const list = getCart().map((i) => (i.key === key ? Object.assign({}, i, { note }) : i))
  saveCart(list)
  return list
}

function removeItem(key) {
  const list = getCart().filter((i) => i.key !== key)
  saveCart(list)
  return list
}

function clear() {
  saveCart([])
}

function getCount() {
  return getCart().reduce((s, i) => s + i.quantity, 0)
}

function getTotal() {
  return getCart().reduce((s, i) => s + i.price * i.quantity, 0)
}

module.exports = {
  subscribe,
  getCart,
  addItem,
  updateQuantity,
  updateNote,
  removeItem,
  clear,
  getCount,
  getTotal,
  makeKey,
}
