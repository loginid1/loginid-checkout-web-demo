export dispenser=OZL4D23EET2S44UJBHZGHSMUQPJSA5YK7X4J737N5QZUJY3WE4X6PFHIXE
export wallet=R7ZNP6GYI6XFRIZZGEYPZZKNMXTJW5ZSCALMDNVH2LAKVARMPNSL3B7HAQ

export SANDBOX_HOME=/Users/loginid/workspace/sandbox
$SANDBOX_HOME/./sandbox goal clerk send -f $wallet -a 1000000000000 -t $dispenser

$SANDBOX_HOME/./sandbox goal asset create --creator $dispenser --name "test token" --unitname "LTEST" --total 10000
$SANDBOX_HOME/./sandbox goal asset create --creator $dispenser --name "test token1" --unitname "LTEST1" --total 100000
$SANDBOX_HOME/./sandbox goal asset create --creator $dispenser --name "test token2" --unitname "LTEST2" --total 100000
$SANDBOX_HOME/./sandbox goal asset create --creator $dispenser --name "test token3" --unitname "LTEST3" --total 100000
$SANDBOX_HOME/./sandbox goal asset create --creator $dispenser --name "test token4" --unitname "LTEST4" --total 100000
#./sandbox goal asset send --from $dispenser --to $dispenser --assetid 2 --amount 0 
#./sandbox goal asset send --from $wallet --to $dispenser --assetid 2 --amount 10000