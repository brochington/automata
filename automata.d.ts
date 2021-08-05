import EventEmitter from 'eventemitter3';

type NoInfer<T> = [T][T extends any ? 0 : never];

export type DataSetterFunc<D> = (currentData: D | undefined) => D;
export type DataFunc<D> = (nextData?: D | DataSetterFunc<D>) => D | undefined;

// Transition Functions
export type TransitionResult<T = void> =
  | T
  | Promise<T>
  | Generator
  | AsyncGenerator;

export type TransitionFuncArgs<S extends string, D, NA extends [...any]> = {
  data: DataFunc<D>;
  current: S;
  next: (nextState: S) => void;
  args: NA;
  complete: () => void;
  from: any;
  emit: <P>(eventName: string, payload?: P) => void;
};

export type TransitionFunc<S extends string, D, NA extends [...any]> = {
  (args: TransitionFuncArgs<S, D, NA>): TransitionResult;
};

export type StateObj<S extends string, D, NA extends [...any]> = {
  enter?: EnterFunc<S, D>;
  on?: TransitionFunc<S, D, NA>;
  exit?: ExitFunc<S, D>;
  // next?: S, // TODO!!
  final?: boolean;
};

export type States<S extends string, D, NA extends [...any]> = {
  [key in S]: StateObj<S, D, NA> | TransitionFunc<S, D, NA> | { next: S };
};

// Exit Functions
export type ExitFuncArgs<S extends string, D> = {
  data: DataFunc<D>;
  previousState: S;
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
): maybeExitFunc is EnterFunc<S, D>;

// Enter Functions
export type EnterFuncArgs<S extends string, D> = {
  data: DataFunc<D>;
  previousState: S;
  nextState: S;
};

export type EnterFunc<S extends string, D> = (
  args: EnterFuncArgs<S, D>
) => TransitionResult;

export type EnterEvents<S extends string, D> = {
  [key in S]?: EnterFunc<S, D>;
};

export function isEnterFunc<S extends string, D>(
  maybeEnterFunc: any
): maybeEnterFunc is EnterFunc<S, D>;

export type AutomataConfig<S extends string, D, NA extends [...any]> = {
  initial: NoInfer<S>;
  data?: D;
  args?: NA;
  states: States<S, D, NA>;
  events?: Record<string, <P>(evt: EmittedEvent) => void>;
};

export type InnerStates = 'idle' | 'transitioning';

// Guard Functions
export function isTransitionFunc<S extends string, D, NA extends [...any]>(
  maybeFunc: any
): maybeFunc is TransitionFunc<S, D, NA>;

export type EmittedEvent<P = any> = {
  source: Automata<any, unknown, [...any]>; // uuid of source fsm.
  event: string;
  payload?: P;
};

export type WatchedFSM = {
  events: {
    emit: (emittedEvent: EmittedEvent) => void;
    destroy: (EmittedEvent: EmittedEvent) => void;
  };
};

export default class Automata<
  S extends string,
  D,
  NA extends [...any]
> extends EventEmitter {
  private _id: string;
  private _current: S;
  private _complete: boolean;
  private _innerState: InnerStates;
  private _data: D | undefined;
  private _states: States<S, D, NA>;

  private _watched: Map<string, WatchedFSM>;

  _config: AutomataConfig<S, D, NA>;

  constructor(config: AutomataConfig<S, D, NA>);

  get id(): string;

  get current(): S;

  get complete(): boolean;

  get data(): D | undefined;

  next(nextData?: D | DataSetterFunc<D>): Promise<void>;

  private _runCurrentTransition(): Promise<void>;

  private _runExit(prevStateKey: S, nextStateKey: S): Promise<void>;

  private _runEnter(prevStateKey: S, nextStateKey: S): Promise<void>;

  private _setData(nextData?: D | DataSetterFunc<D>): D | undefined;

  private _handleTransitionResult(result: TransitionResult): Promise<void>;

  reset(): void;

  check(checkState: S): boolean;

  watch<A extends Automata<any, any, any>>(fsmToWatch: A);

  unwatch<SS extends string, DD, NNA extends [...any]>(fsmToWatch: Automata<SS, DD, NNA>);

  destroy();
}
