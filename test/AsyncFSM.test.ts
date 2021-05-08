import { expect } from 'chai';
import AsyncFSM from '../src/AsyncFSM';
import noop from 'lodash/noop';

describe('AsyncFSM', () => {
  it('Can be created', () => {
    // type States = 'a' | 'b';
    const fsm = new AsyncFSM({
      initial: 'a',
      data: {
        something: 'here',
      },
      transitions: {
        a: ({ next, data }) => next('b'),
        b: ({ next }) => next('b'),
      },
    });

    expect(fsm).to.be.an.instanceof(AsyncFSM);
  });

  it('fsm.complete is correctly set', async () => {
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

    // Double checking that state stays on 'c'.
    await fsm.next();
    expect(fsm.current).to.equal('c');
    expect(fsm.complete).to.equal(true);
  });

  context('Data', () => {
    it('Updates data through normal transitions', async () => {
      const fsm = new AsyncFSM({
        initial: 'a',
        final: 'c',
        data: {
          count: 0,
        },
        transitions: {
          a: ({ next, data }) => {
            // Setting the value directly.
            data({ count: 1 });
            next('b');
          },
          b: ({ next, data }) => {
            // Using a function to update the data.
            data(({ count }) => ({ count: count + 1 }));
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

    it('Updates data via fsm.next()', async () => {
      const fsm = new AsyncFSM({
        initial: 'a',
        final: 'c',
        data: 0,
        transitions: {
          a: ({ next, data }) => {
            const count = data();
            data(count + 1);
            next('b');
          },
          b: ({ next, data }) => {
            // Using a function to update the data.
            data(count => count + 1);
            next('c');
          },
          c: noop,
        },
      });

      expect(fsm.data).to.equal(0);
      expect(fsm.complete).to.equal(false);

      await fsm.next(1);
      expect(fsm.data).to.equal(2);
      expect(fsm.complete).to.equal(false);

      await fsm.next(count => count + 1);
      expect(fsm.data).to.equal(4);
      expect(fsm.complete).to.equal(true);
    });

    it('Data is updated correctly through async and generator transitions', async () => {
      const fsm = new AsyncFSM({
        initial: 'a',
        data: 0,
        transitions: {
          a: ({ data, next }) => {
            data(count => count + 1);
            next('b');
          },
          b: async ({ data, next }) => {
            const nextData = await Promise.resolve(data() + 1);
            data(nextData);
            next('c');
          },
          c: function* ({ data, next }) {
            data(count => count + 1);
            yield;

            data(count => count + 1);
            yield;

            data(count => count + 1);
            yield;

            next('d');
          },
          d: async function* ({ data, next }) {
            const nextData1 = await Promise.resolve(data() + 1);
            data(nextData1);

            yield;

            const nextData2 = await Promise.resolve(data() + 1);
            data(nextData2);

            yield;

            next('e');
          },
          e: noop,
        }
      });

      expect(fsm.data).to.equal(0);

      await fsm.next(); // in a
      expect(fsm.current).to.equal('b');
      expect(fsm.data).to.equal(1);

      await fsm.next(); // in b
      expect(fsm.current).to.equal('c');
      expect(fsm.data).to.equal(2);

      await fsm.next(); // in c
      expect(fsm.current).to.equal('d');
      expect(fsm.data).to.equal(5);

      await fsm.next(); // in d...?
      expect(fsm.current).to.equal('e');
      expect(fsm.data).to.equal(7);
    });
  });

  context('async', () => {
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
  });

  context('Generators', () => {
    context('generator transitions', () => {
      it('calls generator function until exausted', async () => {
        const genFSM = new AsyncFSM({
          initial: 'a',
          data: 0,
          transitions: {
            a: function* ({ data }) {

              while (true) {
                if (data() < 10) {
                  data((count) => count + 1 );
                  yield;
                } else {
                  return;
                }
              }
            },
          },
        });

        // genFSM.on('transitionend', () => {
        //   console.log('transition has ended!!');
        //   done();
        // });

        await genFSM.next();
        expect(genFSM.data).to.equal(10);
      });
    });
  });
});
