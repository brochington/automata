import { expect } from 'chai';
import FSM from '../src/FSM';

describe('FSM', () => {
  it('Can be created', () => {
    const fsm = new FSM<'a' | 'b'>('a', {
      a: ({ next }) => next('b'),
      b: ({ next }) => next('b'),
    });

    expect(fsm).to.be.an.instanceof(FSM);
  });
});
