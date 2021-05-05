import EventEmitter from 'eventemitter3';
import { isFunction } from 'lodash';
import { isIterable, isAsyncIterable, isGeneratorFunction, isAsyncGeneratorFunction } from 'utils'

export type TransitionFuncArgs<S extends string, D> = {
  data: (nextData: D) => void;
  current: S;
  next: (nextState: S) => void;
};

export type TransitionFunc<S extends string, D> = 
  | { (args: TransitionFuncArgs<S, D>): void }
  // | { (args: TransitionFuncArgs<S, D>): Promise<void> }
  // | { (args: TransitionFuncArgs<S, D>): Generator };

export type TransitionEnterFuncArgs<S extends string, D> = {
  // from
  data: (nextData: D) => void;
}

export type TransitionEventFuncs<S extends string, D> = {
  enter: () => {}
  exit: () => {}
  run: () => {}
}

export type Transitions<States extends string, D> = {
  [key in States]: TransitionFunc<States, D> | TransitionEventFuncs<States, D>;
}

export type FSMConfig<S extends string, SS extends string, D> = {
  initial: S;
  final?: S;
  transitions: Transitions<SS, D>;
};

export type InnerStates = 
| 'idle'
| 'transitioning' 

export default class FSM<S extends string, D = undefined> extends EventEmitter {
  private _current: S;
  private _complete: boolean = false;
  private _innerState: InnerStates = 'idle';

  inital: S;

  transitions: Transitions<S, D>;

  _config: FSMConfig<S, S, D>;

  constructor(config: FSMConfig<S, S, D>) {
    super();

    this.inital = config.initial;
    this._current = config.initial;
    this.transitions = config.transitions;
    this._config = config;
  }

  get current(): S {
    return this._current;
  }

  get complete(): boolean {
    return this._complete;
  }

  next(data?: D): void {
    this._transition();
  };

  async _transition() {
    const transition = this.transitions[this.current];

    if (isFunction(transition)) {
      const transitionArgs = { 
        next: (nextState: S) => {
          this._current = nextState;
        }
      }

      const result = transition(transitionArgs);

      if (this._current === this._config.final) {
        this._complete = true;
      }

      return;
    }

    // should be an object of event functions.
    if (transition)
  }

  reset(): void {
    this._current = this.inital;
  }

  // maybe rename this to peek?
  is(checkState: S): boolean {
    return this.current === checkState;
  }
}
