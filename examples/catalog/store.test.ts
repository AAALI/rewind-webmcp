import { describe, expect, it } from 'vitest';
import { matchesProductQuery, productFor } from './store';

describe('product discovery', () => {
  it.each(['black VistaMesh Tee', 'VistaMesh Tee black', '  BLACK   tee  ', ''])('matches words in any order: %s', (query) => {
    expect(matchesProductQuery(productFor('vistamesh'), query)).toBe(true);
  });
  it('still excludes products missing a requested color or name', () => {
    expect(matchesProductQuery(productFor('vistamesh'), 'pink tee')).toBe(false);
    expect(matchesProductQuery(productFor('briskrun'), 'black VistaMesh Tee')).toBe(false);
  });
});
