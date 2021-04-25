StateCharts are statemachines of statemachines. Basically a "higher level" of state.


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
}).monitor(fsm1)

```