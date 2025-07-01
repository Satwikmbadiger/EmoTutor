# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./

RUN pip install --upgrade pip && \
    pip install \
      --retries 5 \
      --timeout 120 \
      --resume-retries 3 \
      --prefer-binary \
      --no-cache-dir \
      -i https://pypi.tuna.tsinghua.edu.cn/simple \
      -r requirements.txt

COPY . .

ENV FLASK_ENV=production
EXPOSE 10000
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:10000"]
