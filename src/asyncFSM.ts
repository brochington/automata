import EventEmitter from 'eventemitter3';
import { isFunction, isObject, isUndefined } from 'lodash';
import {
  isIterable,
  isAsyncIterable,
  isGeneratorFunction,
  isAsyncGeneratorFunction,
  isPromise,
} from 'utils';

type NoInfer<T> = [T][T extends any ? 0 : never];

export type DataSetterFunc<D> = (currentData: D | undefined) => D;
export type DataFunc<D> = (nextData?: D | DataSetterFunc<D>) => D | undefined;

// Transition Functions
export type TransitionResult =
  | void
  | Promise<void>
  | Generator
  | AsyncGenerator;

export type TransitionFuncArgs<S extends string, D> = {
  data: DataFunc<D>;
  current: S;
  next: (nextState: S) => void;
  from: any,
  emit: <P>(eventName: string, payload?: P) => void,
};

export type TransitionFunc<S extends string, D> = {
  (args: TransitionFuncArgs<S, D>): TransitionResult;
};

export type Transitions<S extends string, D> = {
  [key in S]: TransitionFunc<S, D>;
};

// Exit Functions
export type ExitFuncArgs<S extends string, D> = {
  data: DataFunc<D>;
  nextState: S;
};

export type ExitFunc<S extends string, D> = (
  args: ExitFuncArgs<S, D>
) => TransitionResult;

export type ExitEvents<S extends string, D> = {
  [key in S]?: ExitFunc<S, D>;
};

export function isExitFunc<S extends string, D>(
  maybeExitFunc: any
): maybeExitFunc is EnterFunc<S, D> {
  return maybeExitFunc && isFunction(maybeExitFunc);
}

// Enter Functions
export type EnterFuncArgs<S extends string, D> = {
  data: DataFunc<D>;
  previousState: S;
};

export type EnterFunc<S extends string, D> = (
  args: EnterFuncArgs<S, D>
) => TransitionResult;

export type EnterEvents<S extends string, D> = {
  [key in S]?: EnterFunc<S, D>;
};

export function isEnterFunc<S extends string, D>(
  maybeEnterFunc: any
): maybeEnterFunc is EnterFunc<S, D> {
  return maybeEnterFunc && isFunction(maybeEnterFunc);
}

export type FSMConfig<S extends string, D> = {
  initial: NoInfer<S>;
  final?: NoInfer<S>;
  data?: D;
  transitions: Transitions<S, D>;
  enter?: EnterEvents<S, D>;
  exit?: ExitEvents<S, D>;
};

export type InnerStates = 'idle' | 'transitioning';

// Guard Functions
export function isTransitionFunc<S extends string, D>(
  maybeFunc: any
): maybeFunc is TransitionFunc<S, D> {
  return typeof maybeFunc === 'function';
}

export default class AsyncFSM<S extends string, D> extends EventEmitter {
  private _current: S;
  private _complete: boolean = false;
  private _innerState: InnerStates = 'idle';

  inital: S;

  private _final: S | null;

  private _data: D | undefined;

  private _transitions: Transitions<S, D>;

  private _enter: EnterEvents<S, D>;

  private _exit: ExitEvents<S, D>;

  _config: FSMConfig<S, D>;

  constructor(config: FSMConfig<S, D>) {
    super();

    this.inital = config.initial;
    this._current = config.initial;
    this._transitions = config.transitions;
    this._enter = config.enter || {};
    this._exit = config.exit || {};
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

  async next(nextData?: D | DataSetterFunc<D>) {
    if (arguments.length > 0) {
      await this._setData(nextData);
    }

    if (this._innerState === 'idle') {
      await this._runCurrentTransition();
    } else {
      console.error('Unable to transition when not in an idle state.');
      // maybe send some kind of event like "onidle"?
    }
  }

  private async _runCurrentTransition() {
    this._innerState = 'transitioning';
    const currentTransition = this._transitions[this._current];
    
    if (isTransitionFunc<S, D>(currentTransition)) {
      const transitionArgs = {
        current: this._current,
        next: async (nextState: S) => {
          const previousState = this._current;

          await this._runExit(nextState);

          this._current = nextState;

          // QUESTION: Should this be pre or post enter function call?
          if (this._current === this._final) {
            this._complete = true;
          }

          await this._runEnter(previousState);
        },
        data: this._setData.bind(this),
        emit: <P>(event: string, payload?: P) => {
          this.emit('emit', { event, payload });
        },
        from: () => { } // unimplemented!
      };

      const result = currentTransition(transitionArgs);

      await this._handleTransitionResult(result);

      this._innerState = 'idle';
    }
  }

  private async _runExit(nextState: S) {
    const currentTransition = this._transitions[this._current];
    const nextTransition = this._transitions[nextState];
    const currentExit = this._exit[this._current];

    if (isExitFunc(currentExit)) {
      const result = currentExit({
        data: this._setData.bind(this),
        nextState,
      });

      await this._handleTransitionResult(result);
    }
  }

  private async _runEnter(previousState: S) {
    const currentTransition = this._transitions[previousState];
    const nextTransition = this._transitions[this._current];
    const nextEnter = this._enter[this._current];

    if (isEnterFunc(nextEnter)) {
      const result = nextEnter({
        data: this._setData.bind(this),
        previousState,
      });

      await this._handleTransitionResult(result);
    }
  }

  private _setData(nextData?: D | DataSetterFunc<D>): D | undefined {
    // no nextData is set.
    if (arguments.length === 0) {
      return this._data;
    }

    this._data = isFunction(nextData) ? nextData(this._data) : nextData;

    return this._data;
  }

  private async _handleTransitionResult(result: TransitionResult) {
    if (!result) {
      return;
    }

    if (isPromise(result)) {
      await result;
    } else if (isGeneratorFunction(result)) {
      for (const g of result) {
        // Question: What should I do here, if anything?
      }
    } else if (isAsyncGeneratorFunction(result)) {
      for await (const g of result) {
        // Question: What should I do here, if anything?
      }
    }
  }

  reset(): void {
    this._current = this.inital;
  }

  // maybe rename this to peek?
  check(checkState: S): boolean {
    return this.current === checkState;
  }

  watch<SS extends string, DD>(fsmToMonitor: AsyncFSM<SS, DD>) {
    fsmToMonitor.on('emit', ({ event, payload }) => {
      console.log('emitt!!!!!!', event, payload);
    });

    // TODO: Add an destroy event that removes event handlers when child is destroyed.

    return this;
  }
}
