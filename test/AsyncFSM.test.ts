import { expect } from 'chai';
import AsyncFSM from '../src/AsyncFSM';
import noop from 'lodash/noop';
import sinon from 'sinon';

describe('AsyncFSM', () => {
  it('Can be created', () => {
    const fsm = new AsyncFSM({
      initial: 'a',
      data: {
        something: 'here',
      },
      states: {
        a: ({ next }) => next('b'),
        b: ({ next }) => next('b'),
      },
    });

    expect(fsm).to.be.an.instanceof(AsyncFSM);
  });

  it('fsm.complete is correctly set', async () => {
    const fsm = new AsyncFSM({
      initial: 'a',
      states: {
        a: ({ next }) => next('b'),
        b: ({ next }) => next('c'),
        c: { final: true },
      },
    });

    expect(fsm.current).to.equal('a');

    await fsm.next();
    expect(fsm.current).to.equal('b');

    await fsm.next();
    expect(fsm.current).to.equal('c');
    expect(fsm.complete).to.equal(true);
  });

  it('Cycles through standard transitions', async () => {
    const fsm = new AsyncFSM({
      initial: 'a',
      states: {
        a: ({ next }) => next('b'),
        b: ({ next }) => next('c'),
        c: noop,
      },
    });

    expect(fsm.current).to.equal('a');

    await fsm.next();
    expect(fsm.current).to.equal('b');

    await fsm.next();
    expect(fsm.current).to.equal('c');

    // Double checking that state stays on 'c'.
    await fsm.next();
    expect(fsm.current).to.equal('c');
  });

  context('Data', () => {
    it('Updates data through normal transitions', async () => {
      const fsm = new AsyncFSM({
        initial: 'a',
        data: {
          count: 0,
        },
        states: {
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

      await fsm.next();
      expect(fsm.data.count).to.equal(1);

      await fsm.next();
      expect(fsm.data.count).to.equal(2);
    });

    it('Updates data via fsm.next()', async () => {
      const fsm = new AsyncFSM({
        initial: 'a',
        data: 0,
        states: {
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

      await fsm.next(1);
      expect(fsm.data).to.equal(2);

      await fsm.next(count => count + 1);
      expect(fsm.data).to.equal(4);
    });

    it('Data is updated correctly through async and generator transitions', async () => {
      const fsm = new AsyncFSM({
        initial: 'a',
        data: 0,
        states: {
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

  context('Async', () => {
    it('can take async function types', async () => {
      const fsm = new AsyncFSM({
        initial: 'a',
        states: {
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

      await fsm.next();
      expect(fsm.current).to.equal('b');

      await fsm.next();
      expect(fsm.current).to.equal('c');
    });
  });

  context('Generators', () => {
    context('generator transitions', () => {
      it('calls generator function until exausted', async () => {
        const genFSM = new AsyncFSM({
          initial: 'a',
          data: 0,
          states: {
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

  context('Events', () => {

  });

  context('Instance methods', () => {
    it('fsm.monitor()', () => {
      const fsm1 = new AsyncFSM({
        initial: 'a',
        data: {
          something: 'here',
        },
        states: {
          a: ({ next, emit }) => {
            emit('aa');
            next('b');
          },
          b: noop,
        },
      });

      const fsm2 = new AsyncFSM({
        initial: 'aa',
        data: {
          something: 'here',
        },
        states: {
          aa: ({ next }) => {

          },
        },
      });

      fsm2.watch(fsm1);

      fsm1.next();
    });
  });

  context('States Object', () => {
    context('Enter', () => {
      it('Enter state function is called', async () => {
        const enterFake = sinon.fake();
        const fsm = new AsyncFSM({
          initial: 'a',
          data: [] as string[],
          states: {
            a: ({ data, next }) => {
              data([...data(), 'a']);

              next('b');
            },
            b: {
              enter: ({ data }) => {
                data([...data(), 'b']);
                enterFake();
              },
              on: noop,
            }
          }
        });

        await fsm.next();
        expect(enterFake.callCount).to.equal(1);
        expect(fsm.data).to.eql(['a', 'b']);
      });

      it('Enter state can be async or generator function', async () => {
        const enterFake = sinon.fake();
        const fsm = new AsyncFSM({
          initial: 'a',
          data: [] as string[],
          states: {
            a: ({ data, next }) => {
              data([...data(), 'a']);
              next('b');
            },
            b: {
              enter: async ({ data }) => {
                const asyncB = await Promise.resolve('async-b');
                data([...data(), asyncB]);
                enterFake();
              },
              on: ({ next }) => { next('c')},
            },
            c: {
              enter: function* ({ data }) {
                data([...data(), 'gen-b-1']);
                yield;
                data([...data(), 'gen-b-2']);
                yield;
              },
              on: noop,
            }
          }
        });

        expect(fsm.data).to.eql([]);

        await fsm.next();
        expect(fsm.data).to.eql(['a', 'async-b']);

        await fsm.next();
        expect(fsm.data).to.eql(['a', 'async-b', 'gen-b-1', 'gen-b-2']);
        expect(enterFake.callCount).to.equal(1);
      });
    });

    context('Exit', () => {
      it('Exit state function is called', async () => {
        const exitFake = sinon.fake();
        const fsm = new AsyncFSM({
          initial: 'a',
          data: [] as string[],
          states: {
            a: {
              on: ({ data, next }) => {
                data([...data(), 'a']);
                next('b');
              },
              exit: async ({ data }) => {
                const exitA = await Promise.resolve('exit-a');
                data([...data(), exitA]);
                exitFake();
              },
            },
            b: {
              on: ({ data, next }) => {
                data([...data(), 'b']);
                next('c');
              },
              exit: function* ({ data }) {
                exitFake();

                data([...data(), 'exit-b-1']);
                yield;

                data([...data(), 'exit-b-2']);
                yield;
              },
            },
            c: noop,
          }
        });

        expect(fsm.data).to.eql([]);
        
        await fsm.next();
        expect(fsm.data).to.eql(['a', 'exit-a']);
        expect(fsm.current).to.equal('b');

        await fsm.next();
        expect(fsm.data).to.eql(['a', 'exit-a', 'b', 'exit-b-1', 'exit-b-2']);

        expect(exitFake.callCount).to.equal(2);
      });
    });
  });
});
