import { Injectable, BadRequestException } from '@nestjs/common';
import { ApplicationState, AutonomyMode } from '../../entities/application.entity';

@Injectable()
export class ApplicationStateMachine {
  // Valid state transitions
  private validTransitions: Map<ApplicationState, ApplicationState[]> = new Map([
    [ApplicationState.DRAFT, [
      ApplicationState.PENDING_TAILORING,
      ApplicationState.WITHDRAWN,
    ]],
    [ApplicationState.PENDING_TAILORING, [
      ApplicationState.TAILORED,
      ApplicationState.DRAFT,
      ApplicationState.WITHDRAWN,
    ]],
    [ApplicationState.TAILORED, [
      ApplicationState.PENDING_APPLICATION,
      ApplicationState.PENDING_TAILORING,
      ApplicationState.WITHDRAWN,
    ]],
    [ApplicationState.PENDING_APPLICATION, [
      ApplicationState.SUBMITTED,
      ApplicationState.TAILORED,
      ApplicationState.WITHDRAWN,
    ]],
    [ApplicationState.SUBMITTED, [
      ApplicationState.ACCEPTED,
      ApplicationState.REJECTED,
      ApplicationState.WITHDRAWN,
    ]],
    [ApplicationState.ACCEPTED, []],
    [ApplicationState.REJECTED, []],
    [ApplicationState.WITHDRAWN, []],
  ]);

  // Validate if a transition is allowed
  validateTransition(currentState: ApplicationState, targetState: ApplicationState): boolean {
    const allowedTransitions = this.validTransitions.get(currentState);
    return allowedTransitions?.includes(targetState) || false;
  }

  // Transition state with validation
  transition(state: ApplicationState, targetState: ApplicationState): ApplicationState {
    if (!this.validateTransition(state, targetState)) {
      throw new BadRequestException(`Invalid state transition from ${state} to ${targetState}`);
    }
    return targetState;
  }

  // Check if state is terminal
  isTerminalState(state: ApplicationState): boolean {
    return [
      ApplicationState.ACCEPTED,
      ApplicationState.REJECTED,
      ApplicationState.WITHDRAWN,
    ].includes(state);
  }

  // Check if state allows modifications
  allowsModifications(state: ApplicationState): boolean {
    return [
      ApplicationState.DRAFT,
      ApplicationState.PENDING_TAILORING,
      ApplicationState.TAILORED,
      ApplicationState.PENDING_APPLICATION,
    ].includes(state);
  }
}
