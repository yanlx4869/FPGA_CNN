# ----------------------------
# Team：CNNT  
# Poject: Counter
# Updated: 2022.8.26
# Aurhor: yanlingxiao
# ----------------------------
import pymysql

class Database:
    # 连接数据库
    def get_conn(self):
        """获取数据库连接"""
        conn = pymysql.connect(
            host="39.106.70.54", port=3306,
            user="root", password="yanlx4869@CNN.FPGA",
            database="Web_CNN", charset="utf8"
        )
        # 本地连数据库用39.106.70.54、docker上连数据库用localhost(net==host)
        cursor = conn.cursor()
        # 返回数据库连接和cursor
        return conn, cursor


    # 查询user表中的用户信息
    def find_user(self):
        # 获取数据库连接
        conn, cursor = self.get_conn()
        # 从user表中读取
        sql = "select * from user"
        # 执行命令，获取结果
        cursor.execute(sql)
        result = cursor.fetchall()
        # print(result) # 测试
        # 返回查询到的所有信息
        cursor.close()
        return result

    # 查询user表中的某一用户信息
    def find_one_user(self,user):
        # 获取数据库连接
        conn, cursor = self.get_conn()
        # 从user表中获取用户名为变量user的信息
        sql = "select * from user where username = '" + str(user) + "'"
        cursor.execute(sql)
        result = cursor.fetchall()
        # print(result) # 测试
        cursor.close()
        # 返回查询到的所有信息
        return result

    # 查询某一用户的上传记录
    def find_upload_log(self,user):
        conn, cursor = self.get_conn()
        # 从uploadLog表中获取用户名为变量user的信息
        sql = "select * from uploadLog where username = '" + str(user) + "'"
        # print(sql)
        cursor.execute(sql)
        result = cursor.fetchall()
        # print(result) # 测试
        # 返回查询到的所有信息
        cursor.close()
        return result


