export enum PuzzleState {
  Playing,
  Success,
  Failure,
}

export class Puzzle {
  public state: PuzzleState = PuzzleState.Playing;
  private successCallback?: () => void;
  private failureCallback?: () => void;

  constructor() {
    this.state = PuzzleState.Playing;
  }

  public checkWinCondition(targetReached: boolean): void {
    if (targetReached && this.state === PuzzleState.Playing) {
      this.state = PuzzleState.Success;
      if (this.successCallback) {
        this.successCallback();
      }
    }
  }

  public checkFailureCondition(objectsFell: boolean, timeExceeded: boolean): void {
    if ((objectsFell || timeExceeded) && this.state === PuzzleState.Playing) {
      this.state = PuzzleState.Failure;
      if (this.failureCallback) {
        this.failureCallback();
      }
    }
  }

  public onSuccess(callback: () => void): void {
    this.successCallback = callback;
  }

  public onFailure(callback: () => void): void {
    this.failureCallback = callback;
  }

  public reset(): void {
    this.state = PuzzleState.Playing;
  }
}

