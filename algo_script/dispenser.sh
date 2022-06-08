export dispenser=OZL4D23EET2S44UJBHZGHSMUQPJSA5YK7X4J737N5QZUJY3WE4X6PFHIXE
export wallet=R7ZNP6GYI6XFRIZZGEYPZZKNMXTJW5ZSCALMDNVH2LAKVARMPNSL3B7HAQ

export SANDBOX_HOME=/Users/loginid/workspace/sandbox
$SANDBOX_HOME/./sandbox goal clerk send -f $wallet -a 1000000000000 -t $dispenser

$SANDBOX_HOME/./sandbox goal asset create --creator $wallet --name "test token" --total 10000
#./sandbox goal asset send --from $dispenser --to $dispenser --assetid 2 --amount 0 
#./sandbox goal asset send --from $wallet --to $dispenser --assetid 2 --amount 10000