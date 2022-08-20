from flask import Flask
from flask import request
from flask import render_template
import util
import tkinter.messagebox


app = Flask(__name__)

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

        # tkinter.messagebox.showinfo('提示', '恭喜你，登录成功！')
        return render_template("analyse.html")


    else:
        # tkinter.messagebox.showinfo('提示', '登录失败！请先注册！')
        # return render_template("sign_in.html")
        return "登录失败！请先注册！"


# 注册
@app.route('/signUp', methods=['post'])
def show1():
    # 获取数据库连接和cursor
    conn, cursor = util.get_conn()
    # 键盘录入要添加数据
    username = request.values.get("username")
    password1 = request.values.get("password1")
    password2 = request.values.get("password2")
    #查询该用户是否注册
    result = util.find_user()
    for user in result:
        if username == user[1]:
            # 跳转页面
            flag = False
            # tkinter.messagebox.showinfo('提示', '')
            # return render_template("analyse.html")
            return "抱歉，该用户名已被注册"
            break
        else:
          flag = True


    if flag:
      # 执行添加操作,sql语句尽量使用%s占位符
      if password2 == password1:
        sql = "insert into user values(null, %s, %s)"
        count = cursor.execute(sql, [username, password1])
        # 提交事务
        conn.commit()
        if count > 0:
           return "恭喜，注册成功！"
           # i = 1
           # while 1:
           #     print("这是一个弹出提示框")
           # messagebox.showinfo("提示", "我是一个提示框")
           # time.sleep(5)
        else:
           return "抱歉，注册失败。"
      else :
          return "两次密码不相同，请重新输入密码"

    conn.close()
    cursor.close()


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
