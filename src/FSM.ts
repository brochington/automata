import EventEmitter from 'eventemitter3';
import { isFunction, isObject } from 'lodash';
import {
  isIterable,
  isAsyncIterable,
  isGeneratorFunction,
  isAsyncGeneratorFunction,
  isPromise,
} from 'utils';

type NoInfer<T> = [T][T extends any ? 0 : never];

export type TransitionFuncArgs<S extends string, D> = {
  data: (nextData: D) => void;
  current: S;
  next: (nextState: S) => void;
};

export type TransitionFunc<S extends string, D> =
  | { (args: TransitionFuncArgs<S, D>): void }
  | { (args: TransitionFuncArgs<S, D>): Promise<void> };
// | { (args: TransitionFuncArgs<S, D>): Generator };

export type TransitionEnterFuncArgs<S extends string, D> = {
  // from
  data: (nextData: D) => void;
};

export type TransitionEventFuncs<S extends string, D> = {
  enter?: () => {};
  exit?: () => {};
  run?: () => {};
};

export type Transitions<States extends string, D> = {
  [key in States]: TransitionFunc<States, D> | TransitionEventFuncs<States, D>;
};

export type FSMConfig<S extends string, D> = {
  initial: NoInfer<S>;
  final?: NoInfer<S>;
  data?: D;
  transitions: Transitions<S, D>;
};

export type InnerStates = 'idle' | 'transitioning';

export function isTransitionEventFuncs<S, D>(
  tObj: any
): tObj is TransitionEventFuncs<S, D> {
  if (!tObj || !isObject(tObj)) {
    return false;
  }

  return true;
}

export default class FSM<S extends string, D> extends EventEmitter {
  private _current: S;
  private _complete: boolean = false;
  private _innerState: InnerStates = 'idle';

  inital: S;

  private _final: S | null;

  private _data: D | undefined;

  transitions: Transitions<S, D>;

  _config: FSMConfig<S, D>;

  constructor(config: FSMConfig<S, D>) {
    super();

    this.inital = config.initial;
    this._current = config.initial;
    this.transitions = config.transitions;
    this._config = config;
    this._data = config.data;
    this._final = config.final ?? null;
  }

  get current(): S {
    return this._current;
  }

  get complete(): boolean {
    return this._complete;
  }

  get data(): D | undefined {
    return this._data;
  }

  async next(data?: D) {
    if (this._innerState === 'idle') {
      await this._transition();
    }
  }

  async _transition() {
    this._innerState = 'transitioning';
    const transition = this.transitions[this.current];

    // need to call exit on current state?
    // Only if new type is different that current type...

    if (isFunction(transition)) {
      const transitionArgs = {
        current: this._current,
        next: async (nextState: S) => {
          // Only place to really call enter and exit stuff.
          const currentTransition = this.transitions[this.current];
          const nextTransition = this.transitions[nextState];

          if (isTransitionEventFuncs<S, D>(currentTransition)) {
            if (this._current !== nextState) {
              // exit
              if (currentTransition.exit) {
                await currentTransition.exit(); // can be whatever.
              }
            }
          }

          if (isTransitionEventFuncs<S, D>(nextTransition)) {
            if (this._current !== nextState) {
              // enter
              if (nextTransition.enter) {
                await nextTransition.enter(); // can be whatever
              }
            }
          } else {
            const result = (transition as TransitionFunc<S, D>)(transitionArgs);

            await this.handleTransitionResult(result);
          }


          this._current = nextState;
        },
        data: (nextData: D) => {
          this._data = nextData;
        },
      };

      // isFunction is a guard, so must recast to correct type.
      const result = (transition as TransitionFunc<S, D>)(transitionArgs);

      await this.handleTransitionResult(result);

      if (this._final !== null && this._current === this._config.final) {
        this._complete = true;
      }
    } else if (isTransitionEventFuncs<S, D>(transition)) {
      const { enter, exit, run } = transition;

      if (enter) {
        await this.handleTransitionFunc(enter);
      }
    }

    this._innerState = 'idle';
  }

  async handleTransitionResult(result: void | Promise<void>) {
    if (isPromise<void>(result)) {
      await result;
    }
  }

  reset(): void {
    this._current = this.inital;
  }

  // maybe rename this to peek?
  is(checkState: S): boolean {
    return this.current === checkState;
  }
}
