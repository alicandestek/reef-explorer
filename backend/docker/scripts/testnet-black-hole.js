// @ts-check

//
// delete evm related events and extrinsics for blocks in the black hole
//

import { Client } from 'pg';
import { postgresConnParams } from '../../backend.config.js';

const blackHole = {
  start: 1077077,
  end: 1145000,
};

const main = async () => {
  const client = new Client(postgresConnParams);
  await client.connect();
  for (let blockNumber = blackHole.start; blockNumber <= blackHole.end; blockNumber++) {
    console.log('Processing block', blockNumber);
    let sql = `SELECT * FROM extrinsic WHERE section = 'evm' AND block_number = '${blockNumber}'`;
    let res = await client.query(sql);
    if (res.rows.length > 0) {
      // get number of extrinsics and events for current block
      sql = `SELECT extrinsic_count, event_count FROM block WHERE block_number = '${blockNumber}'`;
      res = await client.query(sql);
      const extrinsicCount = res.rows[0].extrinsic_count;
      const eventCount = res.rows[0].event_count;
      // delete and count affected extrinsics
      sql = `DELETE FROM extrinsic WHERE section = 'evm' AND block_number = '${blockNumber}'`;
      res = await client.query(sql);
      const affectedExtrinsicCount = res.rowCount;
      // delete and count affected events
      sql = `DELETE FROM event WHERE section = 'evm' AND block_number = '${blockNumber}'`;
      res = await client.query(sql);
      const affectedEventCount = res.rowCount;
      // update block counters
      sql = `UPDATE block SET extrinsic_count = '${extrinsicCount - affectedExtrinsicCount}', event_count = '${eventCount - affectedEventCount}' WHERE block_number = '${blockNumber}'`;
      res = await client.query(sql);
    }
  } 
  client.end();  
};

main().catch((error) => {
  console.error('Error:', error);
  process.exit(-1);
});
  