# ----------------------------
# Team：CNNT  
# Poject: Counter
# Updated: 2022.8.26
# Aurhor: yanlingxiao
# ----------------------------

from flask import Flask, url_for, request, render_template, session
from flask import redirect
from util import Database
from unet_pytorch.predict import CNNrun
import random
from flask_mail import Mail, Message
import redis
import os
from datetime import timedelta, datetime
from werkzeug.security import generate_password_hash, check_password_hash

# --------------------------------------------------------------------------
# 初始配置
# --------------------------------------------------------------------------
app = Flask(__name__)
app.config['SECRET_KEY'] = 'CounterCNNT'  # 设置表单交互密钥
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=2) # 设置有效期2天
app.config['MAIL_SERVER'] = "smtp.qq.com"
app.config['MAIL_PORT'] = '465' # 端口号
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_DEBUG'] = True # 开启debug
app.config['MAIL_USERNAME'] = "3599153691@qq.com"
app.config['MAIL_PASSWORD'] = "laktgfhrznbddadf"
app.config['MAIL_DEFAULT_SENDER'] = "3599153691@qq.com" # 默认发送

database = Database() # 数据库

mail=Mail(app) # 邮件
pool = redis.ConnectionPool(host='localhost', port=6379, decode_responses=True)
r = redis.Redis(host='localhost', port=6379, decode_responses=True)  
myCNN = CNNrun() # 神经网络


#首页UI
@app.route('/')
def home():
    return render_template("home.html")


#登录UI页面
@app.route('/sign_in')
def sign_in():
    return render_template("sign_in.html")


#注册UI页面
@app.route('/sign_up')
def sign_up():
    return render_template("sign_up.html")


#找回UI密码
@app.route('/password')
def password():
    return render_template("password.html")


#数据分析UI
@app.route('/analyse')
def analyse():
    return render_template("analyse.html")

#数据报告UI
@app.route('/report')
def report():
    return render_template("report.html")


#个人中心
@app.route('/personal')
def personal():
    user = session.get('username') # 获取当前用户名
    result = database.find_upload_log(user) # 从数据库中获取当前用户信息
    # print(user) # 测试
    tmp = ((0, user),) # 元组，如果未获取用户信息，默认值
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

#关于我们
@app.route('/about_us')
def about_us():
    return render_template("about_us.html")

#修改邮箱
@app.route('/email_modify', methods=['post','get'])
def email_modify() :
    # form表单获取数据
    username = request.values.get("username")
    password = request.values.get("password")
    email = request.values.get("email")
    security_code = request.values.get("security_code")
    user_info = database.find_one_user(session.get('username')) # 获取当前用户信息
    flag = False # 状态值
    code = "error2" # 状态码
    # 判断用户名密码是否符合
    if (username == session.get('username')) and (check_password_hash(user_info[0][2],password)):
        flag = True

    # 符合的前提下
    if flag:
     # 执行修改操作
        if r.get('scode') == security_code: # 验证验证码
            if user_info[0][3] != email: # 验证邮箱
                conn, cursor = database.get_conn() # 连接数据库
                sql = "update user set email = %s where username = %s"
                count = cursor.execute(sql, [email, username])
                # 提交事务
                conn.commit()
                if count > 0:
                    code = "ok"
                else:
                # print("修改失败！")
                    code = "failed"
                # 释放资源
                conn.close()
                cursor.close()
            else:
                code = "error3"
        else:
            # return "验证码错误"
            code = "error1"

    return render_template("modify_email.html",status=code)

#显示邮箱
@app.route('/show_email', methods=['get', 'post'])
def show_email():
    username = session.get("username") # 获取当前用户名
    user_info = database.find_one_user(username) # 获取用户信息
    return user_info[0][3] # 返回用户邮箱


#修改密码
@app.route('/password_modify', methods=['get', 'post'])
def password_modify():
    # form表单
    username = request.values.get("username")
    old_password = request.values.get("oldpassword")
    new_password1 = request.values.get("newpassword1")
    new_password2 = request.values.get("newpassword2")
    code = ""
    flag = False
    #查询该用户是否注册
    user_info = database.find_one_user(session.get('username'))
    if (username == session.get('username')) and (check_password_hash(user_info[0][2],old_password)):
        flag = True
    if flag:
     # 执行修改操作
        if new_password2 == new_password1:
            conn, cursor = database.get_conn()
            sql = "update user set password = %s where username = %s"
            password = generate_password_hash(new_password1)
            count = cursor.execute(sql, [password, username])
            # 提交事务
            conn.commit()
            if count > 0:
                code = "ok"
            else:
                code = "failed"
            # 关闭数据库释放资源
            conn.close()
            cursor.close()
        else:
            code = "error2"
            #两次密码不相同
    else:
        # 用户不存在
        code = "error1"

    return render_template("modify_password.html",status=code)
    
# 反馈意见
@app.route('/feedback', methods=['post'])
def feedback():
    # form表单
    words = request.values.get("feedback")
    # print(words) 测试
    user = session.get('username')
    # 编辑发送邮件
    message = Message(
        subject="Counter树冠识别系统用户反馈信息",
        recipients=['3599153691@qq.com'], 
        body="%s (用户)反馈：\n%s" % (user,words)
    )
    # 发送邮件
    mail.send(message)
    result = database.find_upload_log(user) # 重新获取当前用户信息（邮箱）
    # print(user) # 测试
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
    # print(f"用户名：{username}，密码：{password}")  # 测试
    result = database.find_user() # 获取数据库全部用户信息
    # 遍历查找
    for user in result:
        if username == user[1] and check_password_hash(user[2],password):
            # 跳转页面
            flag = True
            break
    else:                       # 此处的else注意缩进！！！！
        flag = False

    if flag:
        session['username']=username            #设置session为username
        session.permanent = True               #设置session有效时长
        return redirect(url_for('index'))       #将网页重定向到index中
    
    else:
        # print("登录失败！请先注册！") 
        return render_template("sign_in.html",status="error")

# 退出登录
@app.route('/logout')
def logout():
    session.pop('username')                 #删除session中的username值
    session.clear()                        #删除session的所有值
    return redirect(url_for('index'))       #重定向到index页面中

# session
@app.route('/index', methods=['post', 'get'])
def index():
    username=session.get('username')            #获取session中的username值
    if username!=None:
        return render_template('analyse.html',username=username)     #渲染analyse.html并传递username值
    else:
        return render_template('home.html')

# 注册
@app.route('/signUp', methods=['post'])
def show2():
    # 键盘录入要添加数据
    username = request.values.get("username")
    password1 = request.values.get("password1")
    password2 = request.values.get("password2")
    email = request.values.get("email")
    security_code = request.values.get("security_code")
    # print("验证码："+security_code) # 测试
    code = ""
    if (not username) or (not password1):
        flag = False
        code = "empty"
    else: 
        #查询该用户是否注册
        result = database.find_user()
        for user in result:
            if username == user[1]:
                # 更新状态码
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
                # 获取数据库连接和cursor
                conn, cursor = database.get_conn()
                sql = "insert into user values(null, %s, %s, %s)"
                password_locked = generate_password_hash(password1)
                count = cursor.execute(sql, [username, password_locked, email])
                # 提交事务
                conn.commit()
                if count > 0:
                    code = "ok"
                else:
                    code = "failed" # 提交失败
                # 释放资源
                conn.close()
                cursor.close()
            else:
                code = "error1" # 验证码不正确
        else:
            code = "error2" # 密码两次不相符

    return render_template("sign_up.html",status=code)

# 发送邮件 ajax
@app.route('/sendEmail', methods=['get', 'post'])
def send_email():
    email = request.values.get("email")
    # print("email:" + email)  #测试

    # 判断邮箱是否为空
    if not email:
        return "请输入邮箱地址"
    # 生成随机验证码，6位小写字符串
    captcha = ''.join(random.sample(['z','y','x','w','v','u','t','s','r','q','p','o','n','m','l','k','j','i','h','g','f','e','d','c','b','a'], 6))
    # 编辑邮件
    message = Message(
        subject="Counter树冠识别系统验证码",
        recipients=[email], 
        body="您的验证码是：%s" % captcha
    )
    # print(captcha) # 测试
    mail.send(message)
    # 保存验证码至redis，有效时间1分钟
    r.set('scode', captcha, ex=60)

    return "验证码已发送"    
    

#找回密码
@app.route('/password_find', methods=['get', 'post'])
def update_info():
    # form表单获取
    username = request.values.get("username")
    password1 = request.values.get("password1")
    password2 = request.values.get("password2")
    email = request.values.get("email")
    security_code = request.values.get("security_code")
    code = ""
    #查询该用户是否注册
    result = database.find_user()
    for user in result:
        if (username == user[1]) and (email == user[3]):
            # 更新状态码
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
                conn, cursor = database.get_conn()
                sql = "update user set password = %s where username = %s"
                password_locked = generate_password_hash(password1)
                count = cursor.execute(sql, [password_locked, username])
                # 提交事务
                conn.commit()
                if count > 0:
                    code = "ok"
                else:
                    # 数据库连接错误
                    code = "failed"
                # 释放资源
                conn.close()
                cursor.close()
            else:
                # 验证码错误
                code = "error1"
        else:
            # 密码不符合
            code = "error2"
    
    return render_template("password.html",status=code)

# 上传影像图片识别并保存
@app.route('/upload', methods=['post', 'get'])
def upload_files():
    # 获取当前绝对路径
    basedir = os.path.abspath(os.path.dirname(__file__))
    file = request.files["file"] # form表单获取文件
    # 判断是否为空
    if not file:
        return render_template("analyse.html",status="1001")
    else:
        # 获取当前日期时间
        nowTime = datetime.utcnow()
        nowTime = nowTime + timedelta(hours=8)
        nowTime = nowTime.strftime("%H%M%S")
        nowDate = datetime.now().strftime("%Y%m%d")
        # print(nowDate)
        # print(nowTime)
        # 生成随机4为字符串，防止文件重名用
        added = ''.join(random.sample(['z','y','x','w','v','u','t','s','r','q','p','o','n','m','l','k','j','i','h','g','f','e','d','c','b','a'], 4))
        # 新文件名
        file_name = str(nowDate) + str(nowTime) + added
        path = basedir +"/static/img/"
        # print(os.path.splitext(file.filename)[1])
        # print(file.filename)
        # 保存路径
        dir_save_path = path+file_name+"/"
        # 如果路径不存在，则创建文件夹
        if not os.path.exists(dir_save_path):
            os.makedirs(dir_save_path)
        # 最终保存路径
        file_path = path+file_name+"/"+file_name+os.path.splitext(file.filename)[1] 
        # 保存文件
        file.save(file_path)
        # 按照一定格式再次获取日期时间
        nowTime1 = datetime.utcnow()
        nowTime1 = nowTime1 + timedelta(hours=8)
        nowTime1 = nowTime1.strftime("%H:%M:%S")
        nowDate1 = datetime.now().strftime("%Y-%m-%d")
        # 获取当前用户名
        userName = session.get('username')
        # 设置输出结果路径
        dir_output_path = basedir +"/static/img_out/"

        # 运行神经网络，开始推理
        myCNN.cnn_run(dir_save_path,dir_output_path)

        # 向数据库提交上传识别信息
        conn, cursor = database.get_conn() 
        sql = "insert into uploadLog values(null, %s, %s, %s, %s)"
        count = cursor.execute(sql, [userName, nowDate1 ,nowTime1, file.filename])
        # 提交事务
        conn.commit()
        if count > 0:
            conn.close()
            cursor.close()
            return render_template("report.html",name=file_name+os.path.splitext(file.filename)[1],path=file_name)
        else:
            conn.close()
            cursor.close()
            return render_template("analyse.html",status="1001")
        

# 点击运行执行
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
