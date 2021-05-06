import { expect } from 'chai';
import AsyncFSM from '../src/AsyncFSM';
import noop from 'lodash/noop';

describe('AsyncFSM', () => {
  
  it('Can be created', () => {
    // type States = 'a' | 'b';
    const fsm = new AsyncFSM({
      initial: 'a',
      data: {
        something: "here"
      },
      transitions: {
        a: ({ next, data }) => {
          data({ something: "123" });
          next('b');
        },
        b: ({ next }) => next('b'),
      },
    });

    expect(fsm).to.be.an.instanceof(AsyncFSM);
  });

  it('Cycles through standard transitions', async () => {
    const fsm = new AsyncFSM({
      initial: 'a',
      final: 'c',
      transitions: {
        a: ({ next }) => next('b'),
        b: ({ next }) => next('c'),
        c: noop,
      },
    });

    expect(fsm.current).to.equal('a');
    expect(fsm.complete).to.equal(false);

    await fsm.next();
    expect(fsm.current).to.equal('b');
    expect(fsm.complete).to.equal(false);

    await fsm.next();
    expect(fsm.current).to.equal('c');
    expect(fsm.complete).to.equal(true);

    // Make sure that the state stays at 'c'.
    await fsm.next();
    expect(fsm.current).to.equal('c');
    expect(fsm.complete).to.equal(true);
  });

  it('Updates data through normal transitions', async () => {

    const fsm = new AsyncFSM({
      initial: 'a',
      final: 'c',
      data: {
        count: 0,
      },
      transitions: {
        a: ({ next, data }) => {
          data({ count: 1 });
          next('b');
        },
        b: ({ next, data }) => {
          data({ count: 2 });
          next('c');
        },
        c: noop,
      },
    });

    expect(fsm.data.count).to.equal(0);
    expect(fsm.complete).to.equal(false);

    await fsm.next();
    expect(fsm.data.count).to.equal(1);
    expect(fsm.complete).to.equal(false);

    await fsm.next();
    expect(fsm.data.count).to.equal(2);
    expect(fsm.complete).to.equal(true);
  });

  it('can take async function types', async () => {
    const fsm = new AsyncFSM({
      initial: 'a',
      final: 'c',
      transitions: {
        a: async ({ next }) => {
          await Promise.resolve(null);
          next('b');
        },
        b: async ({ next }) => {
          await Promise.resolve(null);
          next('c');
        },
        c: noop,
      },
    });

    expect(fsm.current).to.equal('a');
    expect(fsm.complete).to.equal(false);

    await fsm.next();
    expect(fsm.current).to.equal('b');
    expect(fsm.complete).to.equal(false);

    await fsm.next();
    expect(fsm.current).to.equal('c');
    expect(fsm.complete).to.equal(true);
  });

  it('can take async function types', async () => {
    const fsm = new AsyncFSM({
      initial: 'a',
      final: 'c',
      transitions: {
        a: async ({ next }) => {
          await Promise.resolve(null);
          next('b');
        },
        b: async ({ next }) => {
          await Promise.resolve(null);
          next('c');
        },
        c: noop,
        // c: function* ({ next }) {
        //   next('d');
        // },
        // d: async function* ({ next }) {
        //   await Promise.resolve(null);
        //   next('d');
        // }
      },
    });

    expect(fsm.current).to.equal('a');

    await fsm.next();
    expect(fsm.current).to.equal('b');

    await fsm.next();
    expect(fsm.current).to.equal('c');
  });
});