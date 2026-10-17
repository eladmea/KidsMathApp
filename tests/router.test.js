import { clear, depth, pop, push } from '../src/services/router';

describe('router history', () => {
  it('goes back in the order scenes were opened, then has nowhere to go', () => {
    clear();
    push({ key: 'Home', data: {} });
    push({ key: 'Island', data: { subjectId: 'math' } });
    expect(depth()).toBe(2);
    expect(pop()).toEqual({ key: 'Island', data: { subjectId: 'math' } });
    expect(pop().key).toBe('Home');
    expect(pop()).toBeNull();
  });
});
