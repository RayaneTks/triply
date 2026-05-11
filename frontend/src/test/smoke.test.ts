import { describe, it, expect } from 'vitest';

describe('vitest setup smoke test', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('has access to dom-testing matchers via setup file', () => {
    const el = document.createElement('div');
    el.textContent = 'hello';
    expect(el).toHaveTextContent('hello');
  });
});
