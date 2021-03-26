import { expect } from 'chai';
import FSM from '../src/FSM';

describe('FSM', () => {
  it('Can be created', () => {
    const fsm = new FSM('a', { a: () => 'b', b: () => 'b' });

    expect(fsm).to.be.an.instanceof(FSM);
  });
});
