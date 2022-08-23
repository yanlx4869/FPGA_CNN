import email
from flask import Flask
from flask import request
from flask import render_template
from flask import redirect
import util
from unet_pytorch.predict import *
# import tkinter.messagebox

# ylx add
import random
from flask_mail import Mail, Message
from flask import jsonify
import redis
import os
import datetime

app = Flask(__name__)
# ylx add
app.config['MAIL_SERVER'] = "smtp.qq.com"
# MAIL_USE_SSL:端口号465
app.config['MAIL_PORT'] = '465'
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_DEBUG'] = True
app.config['MAIL_USERNAME'] = "3599153691@qq.com"
app.config['MAIL_PASSWORD'] = "laktgfhrznbddadf"
app.config['MAIL_DEFAULT_SENDER'] = "3599153691@qq.com"

mail=Mail(app)
pool = redis.ConnectionPool(host='localhost', port=6379, decode_responses=True)
r = redis.Redis(host='localhost', port=6379, decode_responses=True)  


#首页
@app.route('/')
def home():
    return render_template("home.html")



#登录页面
@app.route('/sign_in')
def sign_in():
    return render_template("sign_in.html")


#注册页面
@app.route('/sign_up')
def sign_up():
    return render_template("sign_up.html")


#找回密码
@app.route('/password')
def password():
    return render_template("password.html")


#数据分析
@app.route('/analyse')
def analyse():
    return render_template("analyse.html")

#数据报告
@app.route('/report')
def report():
    return render_template("report.html")


#个人中心
@app.route('/personal')
def personal():
    return render_template("personal.html")


#登录
@app.route('/signIn', methods=['post','get'])
def show():
    # 获取用户提交过来的用户名和密码
    username = request.values.get('username')
    password = request.values.get('password')
    print(f"用户名：{username}，密码：{password}")
    result = util.find_user()
    for user in result:
        if username == user[1] and password == user[2]:
            # 跳转页面
            flag = True
            break
    else:
        flag = False

    if flag:
        # print("登录成功！") 
        return render_template("analyse.html")
    
    else:
        # print("登录失败！请先注册！") 
        return render_template("sign_in.html",status="error")


# 注册
@app.route('/signUp', methods=['post'])
def show1():
    # 获取数据库连接和cursor
    conn, cursor = util.get_conn()
    # 键盘录入要添加数据
    username = request.values.get("username")
    password1 = request.values.get("password1")
    password2 = request.values.get("password2")
    # ylx add
    email = request.values.get("email")
    security_code = request.values.get("security_code")
    print("验证码："+security_code)
    #查询该用户是否注册
    result = util.find_user()
    for user in result:
        if username == user[1]:
            # 跳转页面
            flag = False
            return render_template("sign_up.html",status="existed")
            break
        else:
          flag = True


    if flag:
      # 执行添加操作,sql语句尽量使用%s占位符
        if password2 == password1:
            if r.get('scode') == security_code:
                sql = "insert into user values(null, %s, %s, %s)"
                count = cursor.execute(sql, [username, password1, email])
                # 提交事务
                conn.commit()
                if count > 0:
                    return render_template("sign_up.html",status="ok")
                else:
                    return render_template("sign_up.html",status="failed")
            else:
                return render_template("sign_up.html",status="error1")
        else:
            return render_template("sign_up.html",status="error2")

    conn.close()
    cursor.close()

# 发送邮件 ajax
@app.route('/sendEmail', methods=['get', 'post'])
def send_email():
    email = request.values.get("email")
    print("email:" + email)
    
    if not email:
        return "请输入邮箱地址"
    
    captcha = ''.join(random.sample(['z','y','x','w','v','u','t','s','r','q','p','o','n','m','l','k','j','i','h','g','f','e','d','c','b','a'], 6))
    message = Message(
        subject="Counter树冠识别系统验证码",
        recipients=[email], 
        body="您的验证码是：%s" % captcha
    )
    print(captcha)
    mail.send(message)
    r.set('scode', captcha, ex=60)

    return "验证码已发送"    
    

#找回密码
@app.route('/password_find', methods=['get', 'post'])
def update_info():
    conn, cursor = util.get_conn()
    username = request.values.get("username")
    password1 = request.values.get("password1")
    password2 = request.values.get("password2")
    email = request.values.get("email")
    security_code = request.values.get("security_code")


    #查询该用户是否注册
    result = util.find_user()
    for user in result:
        if (username == user[1]) and (email == user[3]):
            # 跳转页面
            flag = True
            break
        else:
             flag = False
             # return "用户名或邮箱错误"
             return render_template("password.html",status="error")
    

    if flag:
     # 执行修改操作
      if password2 == password1:
        if r.get('scode') == security_code:
            sql = "update user set password = %s where username = %s"
            count = cursor.execute(sql, [password1, username])
             # 提交事务
            conn.commit()
            if count > 0:
              # return "修改成功！"
              return render_template("password.html",status="ok")
            else:
              # print("修改失败！")
              return render_template("password.html",status="failed")
        else:
            # return "验证码错误"
            return render_template("password.html",status="error1")
      else:
          # return "两次密码不相同，请重新输入密码"
          return render_template("password.html",status="error2")

    # 释放资源
    conn.close()
    cursor.close()

# 上传影像图片识别并保存
@app.route('/upload', methods=['post', 'get'])
def upload_files():
    basedir = os.path.abspath(os.path.dirname(__file__))
    file = request.files["file"]
    if not file:
        # return jsonify({"status": 1001, "msg": "上传失败"})
        return render_template("analyse.html",status="1001")
    else:
        conn, cursor = util.get_conn()      
        nowTime = datetime.datetime.now().strftime("%H%M%S")
        nowDate = datetime.datetime.now().strftime("%Y%m%d")
        # print(nowDate)
        # print(nowTime)
        added = ''.join(random.sample(['z','y','x','w','v','u','t','s','r','q','p','o','n','m','l','k','j','i','h','g','f','e','d','c','b','a'], 4))
        file_name = str(nowDate) + str(nowTime) + added
        path = basedir +"/static/img/"
        # print(os.path.splitext(file.filename)[1])
        # print(file.filename)
        dir_save_path = path+file_name+"/"
        if not os.path.exists(dir_save_path):
            os.makedirs(dir_save_path)
        file_path = path+file_name+"/"+file_name+os.path.splitext(file.filename)[1]
        file.save(file_path)
        nowTime1 = datetime.datetime.now().strftime("%H:%M:%S")
        nowDate1 = datetime.datetime.now().strftime("%Y-%m-%d")
        dir_output_path = basedir +"/static/img_out/"
        cnn_run(dir_save_path,dir_output_path)
        sql = "insert into uploadLog values(null, %s, %s, %s, %s)"
        count = cursor.execute(sql, ['testname', nowDate1 ,nowTime1, file.filename])
        # 提交事务
        conn.commit()
        data = {
    	    "file_name": [file_name]
	    }
        if count > 0:
            return render_template("report.html",name=file_name+os.path.splitext(file.filename)[1])
        else:
            return render_template("analyse.html",status="1001")
        

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
