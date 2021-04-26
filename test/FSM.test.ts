import { expect } from 'chai';
import FSM from '../src/FSM';

describe('FSM', () => {
  
  it('Can be created', () => {
    type States = 'a' | 'b';
    const fsm = new FSM<States>({
      initial: 'a',
      transitions: {
        a: ({ next }) => next('b'),
        b: ({ next }) => next('b'),
      },
    });

    expect(fsm).to.be.an.instanceof(FSM);
  });

  it('Cycles through standard transitions', () => {
    type States = 'a' | 'b' | 'c';
    const fsm = new FSM<States>({
      initial: 'a',
      final: 'c',
      transitions: {
        a: ({ next }) => next('b'),
        b: ({ next }) => next('c'),
        c: ({ next }) => next('c'),
      },
    });

    expect(fsm.current).to.equal('a');
    expect(fsm.complete).to.equal(false);

    fsm.next();
    expect(fsm.current).to.equal('b');
    expect(fsm.complete).to.equal(false);

    fsm.next();
    expect(fsm.current).to.equal('c');
    expect(fsm.complete).to.equal(true);
  });

  // it('can take async function types', () => {
  //   type States = 'a' | 'b' | 'c' | 'd';
  //   const fsm = new FSM<States>({
  //     initial: 'a',
  //     transitions: {
  //       a: ({ next }) => next('b'),
  //       b: async ({ next }) => next('c'),
  //       c: function* ({ next }) {
  //         next('d');
  //       },
  //       d: async function* ({ next }) {
  //         await Promise.resolve(null);
  //         next('d');
  //       }
  //     },
  //   });
  // });
});