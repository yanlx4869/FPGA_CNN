import code
import email
from flask import Flask, url_for, request, render_template, session
from flask import redirect
import util
from unet_pytorch.predict import CNNrun
# import tkinter.messagebox

# ylx add
import random
from flask_mail import Mail, Message
from flask import jsonify
import redis
import os
import datetime
from datetime import timedelta
# from flask_login import LoginManager, login_required
from werkzeug.security import generate_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = 'CounterCNNT'  # 设置表单交互密钥
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=2)
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

"""login_manager = LoginManager()
login_manager.session_protection = 'strong'
login_manager.login_view = 'login'
login_manager.init_app(app)
"""

mail=Mail(app)
pool = redis.ConnectionPool(host='localhost', port=6379, decode_responses=True)
r = redis.Redis(host='localhost', port=6379, decode_responses=True)  
myCNN = CNNrun()


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
    user = session.get('username')
    conn, cursor = util.get_conn()
    result = util.find_upload_log(user)
    print(user)
    tmp = ((0, user),)
    if result:
        return render_template("personal.html", userlog=result)
    else:
        return render_template("personal.html", userlog=tmp)

    

#修改绑定邮箱UI界面
@app.route('/modify_email')
def modify_email():
    return render_template("modify_email.html")

#修改密码UI界面
@app.route('/modify_password')
def modify_password():
    return render_template("modify_password.html")


#修改邮箱
@app.route('/email_modify', methods=['post'])
def email_modify() :
    conn, cursor = util.get_conn()
    username = request.values.get("username")
    password = request.values.get("password")
    email = request.values.get("email")
    security_code = request.values.get("security_code")
    user_info = util.find_one_user(username)
    flag = False
    code = "error2"
    if (username == session.get('username')) and (user_info[0][2] == password):
        flag = True

    if flag:
     # 执行修改操作
        if r.get('scode') == security_code:
            if user_info[0][3] != email:
                sql = "update user set email = %s where username = %s"
                count = cursor.execute(sql, [email, username])
                # 提交事务
                conn.commit()
                if count > 0:
                    code = "ok"
                else:
                # print("修改失败！")
                    code = "failed"
            else:
                code = "error3"
        else:
            # return "验证码错误"
            code = "error1"
      
    # 释放资源
    conn.close()
    cursor.close()
    return render_template("modify_email.html",status=code)

#显示邮箱
@app.route('/showEmail', methods=['get', 'post'])
def showEmail():
    username = session.get("username")
    conn, cursor = util.get_conn()
    user_info = util.find_one_user(username)
    conn.close()
    cursor.close()
    return user_info[0][3]


#修改密码
@app.route('/password_modify', methods=['get', 'post'])
def password_modify():
    conn, cursor = util.get_conn()
    username = request.values.get("username")
    old_password = request.values.get("oldpassword")
    new_password1 = request.values.get("newpassword1")
    new_password2 = request.values.get("newpassword2")
    code = ""
    #查询该用户是否注册
    flag = False
    user_info = util.find_one_user(username)
    if (username == session.get('username')) and (user_info[0][2] == old_password):
        flag = True
    """
    result = util.find_user()
    for user in result:
        if (username == user[1]) and (old_password == user[2]):
            # 跳转页面
            flag = True
            break 
    """
    if flag:
     # 执行修改操作
        if new_password2 == new_password1:
            sql = "update user set password = %s where username = %s"
            count = cursor.execute(sql, [new_password1, username])
            # 提交事务
            conn.commit()
            if count > 0:
                code = "ok"
            else:
                code = "failed"
        else:
            code = "error2"
            #两次密码不相同
    else:
        # 用户不存在
        code = "error1"
    
    conn.close()
    cursor.close()
    return render_template("modify_password.html",status=code)
    
# 反馈意见
@app.route('/feedback', methods=['post'])
def feedback():
    words = request.values.get("feedback")
    print(words)
    user = session.get('username')
    message = Message(
        subject="Counter树冠识别系统用户反馈信息",
        recipients=['3599153691@qq.com'], 
        body="%s (用户)反馈：\n%s" % (user,words)
    )
    mail.send(message)
    user = session.get('username')
    conn, cursor = util.get_conn()
    result = util.find_upload_log(user)
    #print(user)
    tmp = ((0, user),)
    if result:
        return render_template("personal.html", userlog=result)
    else:
        return render_template("personal.html", userlog=tmp)


#登录
@app.route('/signIn', methods=['post'])
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
        """
        response = redirect(url_for('index'))   #重定向到index路由中，并返回响应对象
        response.set_cookie('username',str(username),max_age=18000) #设置cookie值及属性
        return response
        """
        #username=request.form['username']       #获取请求的username值
        session['username']=username            #设置session为username
        session.permanent = True               #设置session有效时长
        return redirect(url_for('index'))       #将网页重定向到index中
        # return render_template("analyse.html")
    
    else:
        # print("登录失败！请先注册！") 
        return render_template("sign_in.html",status="error")

# 退出登录
@app.route('/logout')
def logout():
    """
    response = redirect(url_for('index'))   #重定向到index视图函数中，获取响应对象
    response.delete_cookie('username')      #删除名为username的cookie值
    return response
    """
    session.pop('username')                 #删除session中的username值
    session.clear()                        #删除session的所有值
    return redirect(url_for('index'))       #重定向到index页面中

# cookie/session
@app.route('/index', methods=['post', 'get'])
def index():
    """
    username = request.cookies.get('username',None)     #获取cookie值
    if username!=None:
        return render_template('analyse.html',username=username) #渲染logout.html到网页中并传递username值
    else:
        return render_template("home.html")
    """
    username=session.get('username')            #获取session中的username值
    if username!=None:
        return render_template('analyse.html',username=username)     #渲染logou.html并传递username值
    else:
        return render_template('home.html')

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
    code = ""
    #查询该用户是否注册
    result = util.find_user()
    for user in result:
        if username == user[1]:
            # 跳转页面
            flag = False
            code = "existed"
            break
    # 此处注意缩进，为for else语句
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
                    code = "ok"
                else:
                    code = "failed"
            else:
                code = "error1"
        else:
            code = "error2"

    conn.close()
    cursor.close()
    return render_template("sign_up.html",status=code)

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
    code = ""
    #查询该用户是否注册
    result = util.find_user()
    for user in result:
        if (username == user[1]) and (email == user[3]):
            # 跳转页面
            flag = True
            break
    else:
        flag = False
        # 用户不存在
        code = "error"


    if flag:
     # 执行修改操作
        if password2 == password1:
            if r.get('scode') == security_code:
                sql = "update user set password = %s where username = %s"
                count = cursor.execute(sql, [password1, username])
                # 提交事务
                conn.commit()
                if count > 0:
                    code = "ok"
                else:
                    # 数据库连接错误
                    code = "failed"
            else:
                # 验证码错误
                code = "error1"
        else:
            # 密码不符合
            code = "error2"
    # 释放资源
    conn.close()
    cursor.close()
    return render_template("password.html",status=code)

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
        userName = session.get('username')
        dir_output_path = basedir +"/static/img_out/"
        myCNN.cnn_run(dir_save_path,dir_output_path)
        sql = "insert into uploadLog values(null, %s, %s, %s, %s)"
        count = cursor.execute(sql, [userName, nowDate1 ,nowTime1, file.filename])
        # 提交事务
        conn.commit()
        if count > 0:
            conn.close()
            cursor.close()
            return render_template("report.html",name=file_name+os.path.splitext(file.filename)[1])
        else:
            conn.close()
            cursor.close()
            return render_template("analyse.html",status="1001")
        

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
