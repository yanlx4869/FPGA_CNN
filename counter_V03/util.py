import pymysql


def get_conn():
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

