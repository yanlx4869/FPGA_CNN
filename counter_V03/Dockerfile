FROM python:3.8.8
EXPOSE 5000
EXPOSE 3306
EXPOSE 465
EXPOSE 6379
WORKDIR /usr/project/unet

COPY requirements.txt ./

RUN pip install --upgrade pip

RUN pip3 install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

COPY . .

CMD ["gunicorn", "app:app", "-c", "./gunicorn.conf.py"]
