# from crypt import methods
from unicodedata import name
from flask import Flask
from flask import request
from flask import render_template
import util
# ylx add
import random
#from flask_cache import Cache
from flask_mail import Mail, Message
import redis

# import string
# import redis


app = Flask(__name__)
# ylx add
app.config['MAIL_SERVER'] = "smtp.qq.com"

# MAIL_USE_TLS:端口号587
# MAIL_USE_SSL:端口号465
# QQ邮箱不支持非加密方式发送邮件
app.config['MAIL_PORT'] = '465'
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_DEBUG'] = True
app.config['MAIL_USERNAME'] = "3599153691@qq.com"
app.config['MAIL_PASSWORD'] = "laktgfhrznbddadf"
app.config['MAIL_DEFAULT_SENDER'] = "3599153691@qq.com"

mail=Mail(app)
#mail.init_app(app)
#app.config['REDIS_URL'] = "redis://:password@localhost:6379/0"
pool = redis.ConnectionPool(host='localhost', port=6379, decode_responses=True)
r = redis.Redis(host='localhost', port=6379, decode_responses=True)  
# redis = Redis(host=os.environ.get('REDIS_HOST', '127.0.0.1'), port=6379)
#redis_client = FlaskRedis()
'''
app.config['REDIS_HOST'] = "127.0.0.1" # redis数据库地址
app.config['REDIS_PORT'] = 6379 # redis 端口号
app.config['REDIS_DB'] = 0 # 数据库名
app.config['REDIS_EXPIRE'] = 60 # redis 过期时间60秒

# cpcache.init_app(app)
r = redis.StrictRedis(host="127.0.0.1", port=6379, db=0)
'''


#登录页面
@app.route('/')
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

#登录
@app.route('/signIn', methods=['get', 'post'])
def show():
    # 获取用户提交过来的用户名和密码
    username = request.values.get('username')
    password = request.values.get('password')
    print("testpoint1")
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
        print("登录成功！") 
        return render_template("sign_in.html")
    else:
        print("登录失败！请先注册！") 
        return render_template("sign_in.html")


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
    # email = "1@qq.com"
    security_code = request.values.get("security_code")
    print("验证码："+security_code)
    
    #查询该用户是否注册
    result = util.find_user()
    for user in result:
        if username == user[1]:
            # 跳转页面
            flag = False
            return "抱歉，该用户名已被注册。"
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
                return "恭喜，注册成功！"
            else:
                return "抱歉，注册失败。"
        else:
            return "验证码错误"
      else:
          return "两次密码不相同，请重新输入密码"

    conn.close()
    cursor.close()

#发送邮件
@app.route('/sendEmail', methods=['get', 'post'])
def send_email():
    email = request.values.get("email")
    print("email:" + email)
    """
    发送邮件我们不需要跳转页面，不需要重定向；邮件地址信息只需通过get方式请求即可
    后台获取邮件信息需要进行相关的判断，没有通过验证就将信息（状态码，信息）发送到前端页面（js文件处理）
    通过验证，我们需要自制验证码，将验证码发送到接收者邮件，并且以邮件地址为键，验证码为值保存到redis缓存中
    :return:
    """
    # /email_captcha/?email=XXX@qq.com
    if not email:
        # return restful.params_error("请输入邮箱地址")
        return "请输入邮箱地址"
    
    
    #source = list(string.ascii_letters)
    #source.extend(map(lambda x: str(x), range(0, 10)))
    #captcha = "".join(random.sample(source, 6))
    #random.randint(0,9)
    captcha = ''.join(random.sample(['z','y','x','w','v','u','t','s','r','q','p','o','n','m','l','k','j','i','h','g','f','e','d','c','b','a'], 6))
    #captcha = "569841"
    message = Message(
        subject="Counter树冠识别系统验证码",
        recipients=['3599153691@qq.com'], 
        body="您的验证码是：%s" % captcha
    )
    print(captcha)
    mail.send(message)
    r.set('scode', captcha, ex=60)
    """
        try:
        mail.send(message)
    except:
        return "500 server_error"
    """
    # cpcache.set(email, captcha)
    return "验证码已发送"    
    

   

#找回密码
@app.route('/password_find', methods=['get', 'post'])
def update_info():
    conn, cursor = util.get_conn()
    username = request.values.get("username")
    password1 = request.values.get("password1")
    password2 = request.values.get("password2")
    # number=int(cursor.lastrowid)
    # result = cursor.fetchall()
    # for i in range(number):
    #     for user in result:
    #         sql="select * from user where id is %s"
    #         if username == cursor.execute(sql,i):
    #查询该用户是否注册
    result = util.find_user()
    for user in result:
        if username == user[1]:
            # 跳转页面
            flag = True
            break
        else:
             flag = False
             return "抱歉，该用户尚未注册。"

    if flag:
     # 执行修改操作
      if password2 == password1:
        sql = "update user set password = %s where username = %s"
        count = cursor.execute(sql, [password1, username])
         # 提交事务
        conn.commit()
        if count > 0:
          return "修改成功！"
        else:
         print("修改失败！")
      else:
          return "两次密码不相同，请重新输入密码"

    # 释放资源
    conn.close()
    cursor.close()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
