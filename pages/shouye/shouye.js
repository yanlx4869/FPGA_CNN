// pages/shouye/shouye.js

Page({
   

  data: {

  },

  transmit:function(){
    wx.getSetting({
      success: (res) => { 
       if (res.authSetting["scope.userInfo"]) {
        wx.navigateTo({
          url: '/pages/result/result',
        })
       }
      
       else{
        wx.showToast({
          title:'请先登陆账号',
          icon:"error"
        })
       }
      }
      })
    }
    
          
        
    })

   
  
  
