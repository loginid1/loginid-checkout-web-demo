export dispenser=OZL4D23EET2S44UJBHZGHSMUQPJSA5YK7X4J737N5QZUJY3WE4X6PFHIXE
export wallet=O6NKCDKDJRQQBYBKMM2JR7K5NCSPLOL3PS7EAMOTLTVQIZWBRKBV3PML3Q

export SANDBOX_HOME=/home/pd/sandbox
sudo $SANDBOX_HOME/./sandbox goal clerk send -f $wallet -a 1000000000000 -t $dispenser

sudo $SANDBOX_HOME/./sandbox goal asset create --creator $wallet --name "test token" --total 10000

sudo ./sandbox goal account import
sudo ./sandbox goal asset send --from $dispenser --to $dispenser --assetid 4 --amount 0 
sudo ./sandbox goal asset send --from $wallet --to $dispenser --assetid 4 --amount 10000