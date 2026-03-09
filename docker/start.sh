#!/bin/sh

# 等待数据库就绪（如果使用外部数据库）
if [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -q "postgresql"; then
    echo "Waiting for database..."
    sleep 5
fi

# 运行数据库迁移
cd /app/server
if [ -n "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    npx prisma migrate deploy || npx prisma db push
fi

# 启动后端服务
echo "Starting backend server..."
node dist/index.js &

# 等待后端启动
sleep 2

# 启动 nginx
echo "Starting nginx..."
nginx -g 'daemon off;'
