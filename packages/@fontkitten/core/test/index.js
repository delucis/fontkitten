import assert from 'assert';
import { makeCreate } from '@fontkitten/core';

describe('@fontkitten/core', () => {
	describe('makeCreate', () => {
		it('returns a function named create', () => {
			const create = makeCreate({});
			assert.equal(typeof create, 'function');
			assert.equal(create.name, 'create');
		});
	});
});
