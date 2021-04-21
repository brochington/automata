export type State = string | number | symbol;

export type TransitionFuncArgs<S extends State, D> = {
  data: D;
  current: S;
  next: (nextState: S) => void;
};

export type TransitionFunc<S extends State, D> = (
  args: TransitionFuncArgs<S, D>
) => void;

export type Transitions<S extends State, D = undefined> = Record<
  S,
  TransitionFunc<S, D>
>;

export default class FSM<S extends State, D = undefined> {
  current: S;

  inital: S;

  transitions: Transitions<S, D>;

  constructor(initialState: S, transitions: Transitions<S, D>) {
    this.inital = initialState;
    this.current = initialState;
    this.transitions = transitions;
  }

  next(data: D): void {
    if (this.transitions[this.current]) {
      this.transitions[this.current]({
        data,
        current: this.current,
        next: this._transitionNext,
      });
    }
  }

  _transitionNext = (nextState: S): void => {
    this.current = nextState;
  };

  reset(): void {
    this.current = this.inital;
  }

  is(checkState: S): boolean {
    return this.current === checkState;
  }
}
