require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcryptjs');
async function main(){
  console.log('Seeding...');
  const pass = await bcrypt.hash('123456',10);
  await pool.query("INSERT IGNORE INTO users (name,email,password_hash,role,department) VALUES (?,?,?,?,?),(?,?,?,?,?)",
    ['Admin','admin@demo.local',pass,'admin','IT','Employee','user@demo.local',pass,'employee','Sales']);
  const items = [
    ['ST-001','กระดาษ A4','สำนักงาน','รีม',20],
    ['ST-002','ปากกาเจล','สำนักงาน','ด้าม',50],
    ['EL-001','ปลั๊กพ่วง 5 ช่อง','ไฟฟ้า','เส้น',5]
  ];
  for(const it of items){
    await pool.query('INSERT IGNORE INTO items (code,name,category,unit,min_stock) VALUES (?,?,?,?,?)', it);
  }
  console.log('Done.'); process.exit(0);
}
main().catch(e=>{console.error(e);process.exit(1)});