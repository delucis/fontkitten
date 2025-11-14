import * as r from '@fontkitten/restructure';

const TableEntry = new r.Struct({
  tag:        new r.String(4),
  checkSum:   r.uint32,
  offset:     new r.Pointer(r.uint32, 'void', { type: 'global' }),
  length:     r.uint32
});

const Directory = new r.Struct({
  tag:            new r.String(4),
  numTables:      r.uint16,
  searchRange:    r.uint16,
  entrySelector:  r.uint16,
  rangeShift:     r.uint16,
  tables:         new r.Array(TableEntry, 'numTables')
});

Directory.process = function() {
  this.tables = Object.fromEntries(this.tables.map(table => [table.tag, table]));
};

export default Directory;
