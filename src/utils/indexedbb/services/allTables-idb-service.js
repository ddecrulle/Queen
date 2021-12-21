import Dexie from 'dexie';
import schema from '../schema2.json';

const clearAllTables = async () => {
  const db = new Dexie('Queen');
  db.version(2).stores(schema);
  await db.open();
  await Promise.all(Object.keys(schema).map(table => db.table(table).clear()));
  await db.close();
};

export default clearAllTables;
