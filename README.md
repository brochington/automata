# Automata

A powerful async finite state machine.

```typescript
const fsm = new Automata({
  initial: 'a',
  states: {
    a: ({ next }) => next('b'),
    b: ({ next }) => next('c'),
    c: { final: true },
  },
});
```
