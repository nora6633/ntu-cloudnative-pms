package edu.ntu.pms.evaluation.enums;

import edu.ntu.pms.evaluation.entity.Evaluation;

public interface EvaluationStateHandler {
    default void handleSubmit(Evaluation eval) {
        throw new UnsupportedOperationException("Submit action not allowed in current state");
    }
    
    default void handleApprove(Evaluation eval) {
        throw new UnsupportedOperationException("Approve action not allowed in current state");
    }
    
    default void handleReject(Evaluation eval) {
        throw new UnsupportedOperationException("Reject action not allowed in current state");
    }

    default void assertIsReview(Evaluation eval) {
        throw new IllegalStateException("Evaluation is not in the required status: REVIEW");
    }

    default void assertIsInitial(Evaluation eval) {
        throw new IllegalStateException("Evaluation is not in the required status: INITIAL");
    }

    default void assertIsPendingGoalApproval(Evaluation eval) {
        throw new IllegalStateException("Evaluation is not in the required status: PENDING_GOAL_APPROVAL");
    }

    default void assertIsWorking(Evaluation eval) {
        throw new IllegalStateException("Evaluation is not in the required status: WORKING");
    }

    default void assertIsPendingReviewConfirmation(Evaluation eval) {
        throw new IllegalStateException("Evaluation is not in the required status: PENDING_REVIEW_CONFIRMATION");
    }

    default void assertIsPendingClosure(Evaluation eval) {
        throw new IllegalStateException("Evaluation is not in the required status: PENDING_CLOSURE");
    }
}
