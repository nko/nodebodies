LD=`stat -t lib`
echo $OLD
while true
do
if [ "$NEW" != "$OLD" ]
then
  echo "Going down..."
  killall -9 node
  echo "Restarting.."
  node ./lib/server.js 8080  2>&1 &
  OLD=$NEW
fi
NEW=`stat -t lib`
done

