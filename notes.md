StateCharts are statemachines of statemachines. Basically a "higher level" of state.

Can I use Staction to make the transitions basically actions?

"data" could be a Proxy
```typescript
// getter
const { stuff } = data;

// setter
data = { newStuff };
```

```typescript
const fsm1 = new FSM({
  initial: 'a',
  final: 'c',
  data: { something: 'here' },
  states: {
    a: ({ next, data }) => {
      // Uses a setter proxy.
      data = { something: 'else' };

      next('b');
    },
    b: ({ next, emit }) => next('c' || 'error');
    c: {
      enter: () => {},
      // Can state be "diverted" in the exit function?
      // Should it have access to next()?
      exit: () => {},
      // run "on" next state transition call.
      run: () => {}
    },
    d: function* ({ next, data }) {
      
    },
    error: ({ emit, data }) => emit('error', data);
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