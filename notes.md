StateCharts are statemachines of statemachines. Basically a "higher level" of state.

### Possible example of events bubbling up through different machines.

#### How best to have inter machine communication? This is why XState uses Actors?

```typescript
const fsm1 = new FSM({
  initial: 'a',
  data: { something: 'here' },
  states: {
    a: ({ next, data }) => {
      data({ something: 'else' });
      // next('b', { something: 'else' }); // or this?
      next('b');
    },
    b: ({ next, emit }) => next('c' || 'error');
    error: ({ emit, data }) => emit('error', data());
  }
});

const fsm2 = new FSM({
  initial: 'c'
  states: {
    c: ({ from }) => {
      if (from('error')) {
        console.log(from.data)
        next('d');
      }
    }
  },
  events: {
    error: () => {
      // do something with fsm that just emitted an 'error' event.
    }
  }
})
.watch(fsm1)
// remove all event listeners
// .unwatch(fsm1)

const fsm3 = new FSM({
  initial: 'a',
  states: {
    first: {
      enter: [errorGuard, () => {}]
      // Add some kind of composition for middleware.
      // How would this be short-circuited? maybe a continue() method?
      // Maybe an abort() method that uses AbortController?
      on: [errorGuard, async () => {
        // do something async.
        next('second');
      }],
      exit: () => {}
    },
    second: {
      on: () => {}
    }
  },
})

```

## Generator transition functions

Would be super cool to have a generator just run all the time....like a machine.

```typescript
const genFSM = new AsyncFSM({
  initial: 'a',
  data: { count: 0 },
  transitions: {
    a: function* ({ data }) {
      data(({ count }) => ({ count: count + 1 }));

      if (data().count === 10) return;

      yield;
    },
  },
});

genFSM.on('transitionend', () => {
  console.log('transition has ended!!');
});

genFSM.next();
```
