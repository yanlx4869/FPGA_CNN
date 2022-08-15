import pymysql


def get_conn():
    """获取数据库连接"""
    conn = pymysql.connect(
        host="localhost", port=3306,
        user="root", password="151zmr",
        database="linda", charset="utf8"
    )
    cursor = conn.cursor()
    # 返回数据库连接和cursor
    return conn, cursor


# 查询user表中的用户信息
def find_user():
    # 获取数据库连接
    conn, cursor = get_conn()
    sql = "select * from user"
    cursor.execute(sql)
    result = cursor.fetchall()
    print(result)
    # 返回查询到的所有信息
    return result


if __name__ == '__main__':
    find_user()

