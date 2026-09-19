const { SHOP_ADDRESS, MAP_SEARCH_NAME, SHOP_LOCATION, PHONES } = require('../../utils/config')
const shopSvc = require('../../services/shop')

Page({
  data: {
    name: MAP_SEARCH_NAME,
    address: SHOP_ADDRESS,
    phones: PHONES,
    hoursText: '',
    latitude: SHOP_LOCATION.latitude,
    longitude: SHOP_LOCATION.longitude,
  },

  onLoad() {
    this.applyMarkers()
    shopSvc
      .getShopInfo()
      .then((info) => {
        this.setData({
          name: info.mapSearchName || MAP_SEARCH_NAME,
          address: info.address || SHOP_ADDRESS,
          phones: info.phones && info.phones.length ? info.phones : PHONES,
          latitude: info.latitude || SHOP_LOCATION.latitude,
          longitude: info.longitude || SHOP_LOCATION.longitude,
        })
      })
      .catch(() => {})
    shopSvc.getBusinessStatus().then((s) => this.setData({ hoursText: s.hoursText })).catch(() => {})
  },

  applyMarkers() {},

  call(e) {
    wx.makePhoneCall({ phoneNumber: e.currentTarget.dataset.phone })
  },

  copyPhone(e) {
    wx.setClipboardData({ data: e.currentTarget.dataset.phone })
  },

  openNav() {
    wx.openLocation({
      latitude: Number(this.data.latitude),
      longitude: Number(this.data.longitude),
      name: this.data.name,
      address: this.data.address,
    })
  },
})
