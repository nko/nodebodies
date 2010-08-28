#! /bin/bash
OLD=`stat -t lib`
echo $OLD
while true
do
if [ "$NEW" != "$OLD" ]
then
  echo "Going down..."
  killall -9 node
  echo "Restarting.."
  node ./server.js 8080  2>&1 &
fi
sleep 5s
OLD=$NEW
NEW=`stat -t lib`
done

