# searchPerfTest
This is just some messing around to measure cassandra search speed. 

This assumes you have Java, Cassandra, and Node installed on your localhost.

Get dependencies with
npm install

Make sure you have a demo1 keyspace in Cassandra. You can create this with using
cqlsh and something like
CREATE KEYSPACE perf1 WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 };

Create the table for test with 
node write.js

To load data, assumes you have a bunch of text in a file called words. Then run
node load.js

Search for the word fluffy with
node query.js fluffy

