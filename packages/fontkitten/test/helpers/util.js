import fs from 'node:fs/promises';
import { create } from 'fontkitten';

/**
 * @param {string | URL} path
 * @param {string=} postscriptName
*/
export async function open(path, postscriptName) {
  let data = await fs.readFile(path);
  return create(data, postscriptName);
}
