StateCharts are statemachines of statemachines. Basically a "higher level" of state.


### Possible example of events bubbling up through different machines.

```typescript
const fsm1 = new FSM({
  initial: 'a',
  data: { something: 'here' },
  transitions: {
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
  transitions: {
    c: ({ from }) => {
      if (from('error')) {
        console.log(from.data)
        next('d');
      }
    }
  }
}).watch(fsm1)

const fsm3 = new FSM({
  initial: 'a',
  transitions: {
    a: async () => {
      // do something async.
      next('b');
    }
  }
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
    }
  }
});

genFSM.on('transitionend', () => {
  console.log('transition has ended!!');
})

genFSM.next();


```