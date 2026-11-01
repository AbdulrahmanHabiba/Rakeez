import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanDuplicateWords } from './speech';

test('cleanDuplicateWords eliminates consecutive repeated words', () => {
  const input = 'عاوز عاوز عاوز اشتغل على مشروعي';
  const expected = 'عاوز اشتغل على مشروعي';
  assert.equal(cleanDuplicateWords(input), expected);
});

test('cleanDuplicateWords preserves non-repeating natural words', () => {
  const input = 'أريد التركيز على مهمة البرمجة اليوم';
  assert.equal(cleanDuplicateWords(input), input);
});

test('cleanDuplicateWords handles mixed casing and whitespace', () => {
  const input = 'focus   focus   now';
  const expected = 'focus now';
  assert.equal(cleanDuplicateWords(input), expected);
});
