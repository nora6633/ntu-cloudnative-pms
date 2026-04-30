package edu.ntu.pms.evaluation.enums;

import java.util.List;
import java.util.Map;

/**
 * Enumeration representing the various statuses an evaluation can be in during its lifecycle.
 * Each status has defined allowed transitions to ensure that the evaluation process follows
 * a valid sequence of states. The assertCanTransitionTo method is used to enforce these
 * transitions and prevent invalid state changes.
 */
public enum EvaluationStatus {
    INITIAL,
    PENDING_GOAL_APPROVAL,
    WORKING,
    REVIEW,
    PENDING_REVIEW_CONFIRMATION,
    PENDING_CLOSURE,
    CLOSED;

    // Define allowed transitions for each status
    private static final Map<EvaluationStatus, List<EvaluationStatus>> ALLOWED_TRANSITIONS = Map.of(
        INITIAL, List.of(PENDING_GOAL_APPROVAL),
        PENDING_GOAL_APPROVAL, List.of(INITIAL, WORKING),
        WORKING, List.of(REVIEW),
        REVIEW, List.of(PENDING_REVIEW_CONFIRMATION),
        PENDING_REVIEW_CONFIRMATION, List.of(REVIEW, PENDING_CLOSURE),
        PENDING_CLOSURE, List.of(REVIEW, CLOSED),
        CLOSED, List.of() // No transitions allowed from CLOSED
    );

    /**
     * Asserts that a transition from the current status to the specified new status is valid.
     * If the transition is not allowed, an IllegalStateException is thrown.
     * @param newStatus The status to which the evaluation is attempting to transition.
     */
    public void assertCanTransitionTo(EvaluationStatus newStatus) {
        if (!ALLOWED_TRANSITIONS.get(this).contains(newStatus)) {
            throw new IllegalStateException(
                String.format("Invalid status transition from %s to %s", this, newStatus)
            );
        }
    }
}
