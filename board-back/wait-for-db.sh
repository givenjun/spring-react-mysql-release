#!/bin/sh

HOST="db"
PORT="3306"

echo "⏳ Waiting for MySQL ($HOST:$PORT) to be ready..."

while ! nc -z $HOST $PORT; do
  echo "⏳ MySQL not yet ready. Waiting..."
  sleep 2
done

echo "✅ MySQL is ready! Starting backend..."
shift
exec "$@"
